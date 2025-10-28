import type { Request, Response } from "express";
import { WalletService } from "../services/wallet.service.js";
import { AppError, BadRequestError } from "../utils/errors.js";
import { logError, logInfo } from "../utils/logger.js";

export class WalletController {
  private walletService = new WalletService();

  async getBalance(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const balance = await this.walletService.getBalance(req.user.id);
      const balanceNumber =
        typeof balance === "string" ? parseFloat(balance) : balance;

      res.json({
        success: true,
        data: {
          balance: balanceNumber.toFixed(2),
          currency: "USD",
        },
      });
    } catch (error) {
      logError("Error getting wallet balance:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get wallet balance",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getTransactions(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const { page = 1, limit = 20, type } = req.query;

      const { transactions, total } =
        await this.walletService.getTransactionHistory(
          req.user.id,
          Number(page),
          Number(limit),
          type as
            | "credit"
            | "debit"
            | "referral"
            | "coupon"
            | "purchase"
            | "refund"
            | undefined
        );

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logError("Error getting wallet transactions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get wallet transactions",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getSummary(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const summary = await this.walletService.getWalletSummary(req.user.id);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logError("Error getting wallet summary:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get wallet summary",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async transferFunds(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const { toUserId, amount, reason } = req.body;

      if (!toUserId || !amount || !reason) {
        throw new BadRequestError("toUserId, amount, and reason are required");
      }

      if (amount <= 0) {
        throw new BadRequestError("Amount must be greater than 0");
      }

      await this.walletService.transferFunds(
        req.user.id,
        toUserId,
        amount,
        reason,
        { transferType: "user_to_user" }
      );

      logInfo(
        `Transfer completed: ${req.user.id} -> ${toUserId}, amount: ${amount}`
      );

      let newBalanceNumber: number;
      try {
        const newBalance = await this.walletService.getBalance(req.user.id);
        newBalanceNumber =
          typeof newBalance === "string" ? parseFloat(newBalance) : newBalance;
      } catch (balanceError) {
        logError("Failed to retrieve balance after transfer:", balanceError);
        return res.json({
          success: true,
          message: "Transfer completed successfully (balance unavailable)",
          data: {
            transaction: {
              amount: amount,
              type: "transfer",
              reason: reason,
            },
          },
        });
      }

      res.json({
        success: true,
        message: "Transfer completed successfully",
        data: {
          newBalance: newBalanceNumber.toFixed(2),
          transaction: {
            amount: amount,
            type: "transfer",
            reason: reason,
            balanceAfter: newBalanceNumber.toFixed(2),
          },
        },
      });
    } catch (error) {
      logError("Error transferring funds:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: "Failed to transfer funds",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
