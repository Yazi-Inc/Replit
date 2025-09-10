import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Payment verification endpoint
  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { reference } = z.object({
        reference: z.string(),
      }).parse(req.body);

      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      
      if (!paystackSecretKey) {
        console.error("Paystack secret key not found");
        return res.status(500).json({
          success: false,
          message: "Payment verification not configured",
        });
      }

      // Verify payment with Paystack API
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Paystack API error:", data);
        return res.status(400).json({
          success: false,
          message: "Payment verification failed",
        });
      }

      // Check if payment was successful
      if (data.status && data.data.status === 'success') {
        res.json({
          success: true,
          message: "Payment verified successfully",
          reference,
          amount: data.data.amount,
          currency: data.data.currency,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Payment was not successful",
          reference,
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
