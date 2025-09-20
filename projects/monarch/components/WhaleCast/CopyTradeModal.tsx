"use client"

import { useState } from "react"

interface CopyTradeModalProps {
  isOpen: boolean
  onClose: () => void
  trade: {
    tokenIn: string
    tokenOut: string
    amountIn: number
    amountOut: number
    price: number
  }
  onConfirm: (amount: number, slippage: number) => void
}

export function CopyTradeModal({
  isOpen,
  onClose,
  trade,
  onConfirm
}: CopyTradeModalProps) {
  const [amount, setAmount] = useState(trade.amountIn.toString())
  const [slippage, setSlippage] = useState("0.5")

  if (!isOpen) return null

  const handleConfirm = () => {
    const numAmount = parseFloat(amount)
    const numSlippage = parseFloat(slippage)
    if (numAmount > 0 && numSlippage >= 0) {
      onConfirm(numAmount, numSlippage)
      onClose()
    }
  }

  const estimatedOutput = (parseFloat(amount) || 0) * trade.price

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="whale-card max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Copy Trade</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Trade route */}
        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-2">Trade Route</div>
          <div className="flex items-center justify-center space-x-4 p-4 bg-gray-200 rounded-xl">
            <div className="text-center">
              <div className="text-lg font-semibold text-white">
                {trade.tokenIn}
              </div>
              <div className="text-sm text-gray-400">Input</div>
            </div>
            <div className="text-2xl">→</div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white">
                {trade.tokenOut}
              </div>
              <div className="text-sm text-gray-400">Output</div>
            </div>
          </div>
        </div>

        {/* Amount input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount ({trade.tokenIn})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
          />
        </div>

        {/* Estimated output */}
        {amount && (
          <div className="mb-4 p-3 bg-gray-200 rounded-xl">
            <div className="text-sm text-gray-400">Estimated Output</div>
            <div className="text-lg font-semibold text-white">
              {estimatedOutput.toFixed(4)} {trade.tokenOut}
            </div>
            <div className="text-sm text-gray-400">
              Rate: {trade.price.toFixed(6)} {trade.tokenOut}/{trade.tokenIn}
            </div>
          </div>
        )}

        {/* Slippage dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Slippage Tolerance
          </label>
          <select
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
          >
            <option value="0.1">0.1%</option>
            <option value="0.5">0.5%</option>
            <option value="1.0">1.0%</option>
            <option value="2.0">2.0%</option>
            <option value="5.0">5.0%</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-400 text-gray-300 hover:bg-gray-200 hover:text-white transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!amount || parseFloat(amount) <= 0}
            className="whale-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Trade
          </button>
        </div>
      </div>
    </div>
  )
}
