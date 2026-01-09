'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Users, 
  Calculator, 
  CreditCard,
  Plus,
  Minus,
  UserPlus,
  DollarSign,
  Percent,
  Receipt,
  ArrowRight
} from 'lucide-react'
import { useGuestLanguage } from '@/contexts/guest-language-context'

interface SplitBillProps {
  totalAmount: number
  onProceed: (splitDetails: SplitDetail[]) => void
  onCancel: () => void
}

interface SplitDetail {
  id: string
  name: string
  amount: number
  percentage?: number
  isPaid: boolean
}

type SplitMethod = 'equal' | 'percentage' | 'custom'

export default function SplitBill({ totalAmount, onProceed, onCancel }: SplitBillProps) {
  const { t } = useGuestLanguage()
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal')
  const [numberOfPeople, setNumberOfPeople] = useState(2)
  const [splits, setSplits] = useState<SplitDetail[]>([])
  const [customAmounts, setCustomAmounts] = useState<{ [key: string]: string }>({})

  // Initialize splits when number of people changes
  const initializeSplits = (count: number) => {
    const newSplits: SplitDetail[] = []
    const amountPerPerson = totalAmount / count
    
    for (let i = 0; i < count; i++) {
      newSplits.push({
        id: `person-${i}`,
        name: `Person ${i + 1}`,
        amount: amountPerPerson,
        percentage: 100 / count,
        isPaid: false
      })
    }
    setSplits(newSplits)
  }

  // Handle number of people change
  const handlePeopleChange = (increment: boolean) => {
    const newCount = increment 
      ? Math.min(numberOfPeople + 1, 10) 
      : Math.max(numberOfPeople - 1, 2)
    
    setNumberOfPeople(newCount)
    
    if (splitMethod === 'equal') {
      initializeSplits(newCount)
    }
  }

  // Calculate equal split
  const calculateEqualSplit = () => {
    const amountPerPerson = totalAmount / numberOfPeople
    const newSplits = splits.map(split => ({
      ...split,
      amount: amountPerPerson,
      percentage: 100 / numberOfPeople
    }))
    setSplits(newSplits)
  }

  // Update custom amount for a person
  const updateCustomAmount = (personId: string, value: string) => {
    setCustomAmounts({ ...customAmounts, [personId]: value })
    
    const amount = parseFloat(value) || 0
    const newSplits = splits.map(split => 
      split.id === personId 
        ? { ...split, amount, percentage: (amount / totalAmount) * 100 }
        : split
    )
    setSplits(newSplits)
  }

  // Update percentage for a person
  const updatePercentage = (personId: string, value: string) => {
    const percentage = parseFloat(value) || 0
    const amount = (totalAmount * percentage) / 100
    
    const newSplits = splits.map(split => 
      split.id === personId 
        ? { ...split, amount, percentage }
        : split
    )
    setSplits(newSplits)
  }

  // Update person name
  const updatePersonName = (personId: string, name: string) => {
    const newSplits = splits.map(split => 
      split.id === personId ? { ...split, name } : split
    )
    setSplits(newSplits)
  }

  // Calculate remaining amount
  const calculatedTotal = splits.reduce((sum, split) => sum + split.amount, 0)
  const remaining = totalAmount - calculatedTotal
  const isBalanced = Math.abs(remaining) < 0.01

  // Initialize with equal split
  if (splits.length === 0) {
    initializeSplits(numberOfPeople)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <Users className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Split the Bill</h2>
        </div>
        <p className="text-gray-600">Easy splitting for groups</p>
        <div className="text-3xl font-bold text-orange-500">
          €{totalAmount.toFixed(2)}
        </div>
      </div>

      {/* Split Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How do you want to split?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={splitMethod} onValueChange={(value) => setSplitMethod(value as SplitMethod)}>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="equal" />
                <div className="flex items-center gap-2 flex-1">
                  <Calculator className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium">Split Equally</div>
                    <div className="text-sm text-gray-500">Divide the bill equally among all</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="percentage" />
                <div className="flex items-center gap-2 flex-1">
                  <Percent className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium">Split by Percentage</div>
                    <div className="text-sm text-gray-500">Each person pays a percentage</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="custom" />
                <div className="flex items-center gap-2 flex-1">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium">Custom Amounts</div>
                    <div className="text-sm text-gray-500">Enter specific amount for each person</div>
                  </div>
                </div>
              </label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Number of People Selector (for equal split) */}
      {splitMethod === 'equal' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Label className="text-base">Number of people</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePeopleChange(false)}
                  disabled={numberOfPeople <= 2}
                  className="h-8 w-8"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="w-12 text-center font-semibold text-lg">
                  {numberOfPeople}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePeopleChange(true)}
                  disabled={numberOfPeople >= 10}
                  className="h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-900">
                Each person pays: <span className="font-bold text-lg">€{(totalAmount / numberOfPeople).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Split Details */}
      {(splitMethod === 'percentage' || splitMethod === 'custom') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Split Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {splits.map((split, index) => (
              <div key={split.id} className="p-3 border rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <Input
                    placeholder="Name"
                    value={split.name}
                    onChange={(e) => updatePersonName(split.id, e.target.value)}
                    className="flex-1"
                  />
                </div>

                {splitMethod === 'percentage' && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="0"
                      value={split.percentage?.toFixed(0) || ''}
                      onChange={(e) => updatePercentage(split.id, e.target.value)}
                      className="w-24"
                    />
                    <span className="text-gray-600">%</span>
                    <span className="ml-auto font-semibold">
                      €{split.amount.toFixed(2)}
                    </span>
                  </div>
                )}

                {splitMethod === 'custom' && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">€</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={customAmounts[split.id] || split.amount.toFixed(2)}
                      onChange={(e) => updateCustomAmount(split.id, e.target.value)}
                      className="flex-1"
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Add Person Button */}
            {splits.length < 10 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const newPerson: SplitDetail = {
                    id: `person-${splits.length}`,
                    name: `Person ${splits.length + 1}`,
                    amount: 0,
                    percentage: 0,
                    isPaid: false
                  }
                  setSplits([...splits, newPerson])
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Person
              </Button>
            )}

            {/* Balance Check */}
            <div className={`p-3 rounded-lg ${isBalanced ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className="flex justify-between items-center">
                <span className={isBalanced ? 'text-green-900' : 'text-yellow-900'}>
                  Total Split:
                </span>
                <span className={`font-bold ${isBalanced ? 'text-green-900' : 'text-yellow-900'}`}>
                  €{calculatedTotal.toFixed(2)}
                </span>
              </div>
              {!isBalanced && (
                <div className="text-sm mt-1 text-yellow-700">
                  Remaining: €{Math.abs(remaining).toFixed(2)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={() => onProceed(splits)}
          disabled={!isBalanced && splitMethod !== 'equal'}
          className="w-full h-14 text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl"
        >
          Proceed to Payment
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          onClick={onCancel}
          className="w-full h-12 text-gray-600"
        >
          Pay Full Amount Instead
        </Button>
      </div>

      {/* Info Text */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>💡 Each person can pay their share separately</p>
        <p>📱 Send payment links to each person</p>
      </div>
    </div>
  )
}