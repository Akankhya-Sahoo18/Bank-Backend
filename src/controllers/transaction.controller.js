const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

/**
 *  CREATE A NEW TRANSACTION:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction(PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notifications
 */

async function createTransaction(req, res) {
  //Validate request

  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "FromAccount, toAccount, amount and idempotency key required",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
  });

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      message: "Invalid fromAccount or toAccount",
    });
  }

  //Validate idempotency key

  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction Already Processed",
        transaction: isTransactionAlreadyExists,
      });
      if (isTransactionAlreadyExists.status === "PENDING") {
        return res.status(200).json({
          message: "Transaction is still processing",
        });
      }
      if (isTransactionAlreadyExists.status === "FAILED") {
        return res.status(500).json({
          message: "Transaction processing failed previously, please retry",
        });
      }
      if (isTransactionAlreadyExists.status === "REVERSED") {
        return res.status(500).json({
          message: "Transaction reversed, please retry",
        });
      }

      //check account status

      if (
        fromUserAccount.status !== "ACTIVE" &&
        toUserAccount.status !== "ACTIVE"
      ) {
        return res.status(400).json({
          message:
            "Both fromAccount and toAccount must be ACTIVE to process transaction",
        });
      }

      //Derive sender balance from ledger

      const balance = await fromUserAccount.getBalance();

      if (balance < amount) {
        return res.status(400).json({
          message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`,
        });
      }

      //create transaction(PENDING)

      const session = await mongoose.startSession();
      session.startTransaction();

      const transaction = await transactionModel.create(
        {
          fromAccount,
          toAccount,
          amount,
          idempotencyKey,
          status: "PENDING",
        },
        { session },
      );

      const debitLedgerEntry = await ledgerModel.create(
        {
          account: fromAccount,
          amount: amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
        { session },
      );

      const creditLedgerEntry = await ledgerModel.create(
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
        { session },
      );

      transaction.status = "COMPLETED";
      await transaction.save({ session });

      await session.commitTransaction();
      session.endSession();

      //send email notification

      await emailService.sendTransactionEmail(
        req.user.email,
        req.user.name,
        amount,
        toAccount,
      );

      return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction,
      });
    }
  }
}

module.exports = { createTransaction };
