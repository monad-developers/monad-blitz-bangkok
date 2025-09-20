'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Play, RotateCcw, Send, Clock, User, Trophy } from 'lucide-react'

export default function MatchPage({ params }: { params: { id: string } }) {
  const [code, setCode] = useState(`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

/*
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 */

int main()
{
    int n;
    cin >> n; cin.ignore();
    for (int i = 0; i < n; i++) {
        int number;
        cin >> number; cin.ignore();
    }
    
    // Write an answer using cout. DON'T FORGET THE "<< endl"
    // To debug: cerr << "Debug messages..." << endl;
    
    cout << "sum" << endl;
}`)

  const [selectedTest, setSelectedTest] = useState(0)
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(892) // 14:52 in seconds

  const problem = {
    title: "Sum of All Elements Except Largest",
    description: `You are given a list of integers.
Your task is to compute the sum of all numbers except the largest one.
Note: Only one occurrence of the maximum element should be excluded from the sum, even if it appears multiple times in the list.`,
    input: {
      line1: "an integer n (number of elements)",
      line2: "n space-separated integers"
    },
    output: "A single integer: the sum of all numbers except the largest element",
    constraints: "2 ≤ n ≤ 10\n-10 ≤ each integer ≤ 10",
    examples: [
      {
        input: "3\n1 5 2",
        output: "3",
        explanation: "Sum excluding largest (5): 1 + 2 = 3"
      }
    ]
  }

  const testCases = [
    {
      name: "Mixed Numbers",
      input: "4\n3 -1 7 2", 
      expectedOutput: "4",
      status: "pending"
    },
    {
      name: "Max Duplicates", 
      input: "5\n1 8 3 8 2",
      expectedOutput: "14",
      status: "pending"
    },
    {
      name: "All Negative",
      input: "3\n-5 -2 -8", 
      expectedOutput: "-13",
      status: "pending"
    }
  ]

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const runTest = async (testIndex?: number) => {
    setIsRunning(true)
    const currentTest = testIndex !== undefined ? testIndex : selectedTest
    
    // Simulate code execution
    setTimeout(() => {
      // Mock result based on test case
      if (currentTest === 0) {
        setOutput("4") // Correct for first test
      } else if (currentTest === 1) {
        setOutput("14") // Correct for second test  
      } else {
        setOutput("-13") // Correct for third test
      }
      setIsRunning(false)
    }, 1000)
  }

  const runAllTests = async () => {
    setIsRunning(true)
    // Simulate running all tests
    setTimeout(() => {
      setOutput("All tests passed! ✅")
      setIsRunning(false)
    }, 2000)
  }

  const submitSolution = async () => {
    setIsRunning(true)
    setTimeout(() => {
      setOutput("Solution submitted! You win! 🏆")
      setIsRunning(false)
      
      // Redirect to result page after a short delay
      setTimeout(() => {
        window.location.href = '/result'
      }, 1500)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      {/* Match Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-white font-semibold">Speed Battle</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-400" />
              <span className="text-slate-300 text-sm">vs 0x1234...5678</span>
            </div>
            <div className="px-3 py-1 bg-green-600 text-white text-sm rounded">
              100 GAME
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-400" />
              <span className="text-orange-400 font-mono">{formatTime(timeLeft)}</span>
            </div>
            <div className="text-slate-400 text-sm">
              Fastest mode
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Panel - Problem Description */}
        <div className="w-1/2 bg-slate-900 border-r border-slate-700 overflow-y-auto">
          <div className="p-6">
            {/* Problem Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">{problem.title}</h1>
              <div className="text-sm text-slate-400">
                A contribution by Thomasj10
              </div>
            </div>

            {/* Goal Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Goal</h3>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                  {problem.description}
                </p>
              </div>
            </div>

            {/* Input/Output */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Input</h3>
              <div className="bg-slate-800 rounded-lg p-4 mb-4">
                <div className="text-slate-300">
                  <div><strong>Line 1:</strong> {problem.input.line1}</div>
                  <div><strong>Line 2:</strong> {problem.input.line2}</div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-3">Output</h3>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-slate-300">{problem.output}</p>
              </div>
            </div>

            {/* Constraints */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Constraints</h3>
              <div className="bg-slate-800 rounded-lg p-4">
                <pre className="text-slate-300 text-sm whitespace-pre-line">
                  {problem.constraints}
                </pre>
              </div>
            </div>

            {/* Example */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Example</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Input</h4>
                  <div className="bg-slate-800 rounded p-3">
                    <pre className="text-slate-300 text-sm">{problem.examples[0].input}</pre>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Output</h4>
                  <div className="bg-slate-800 rounded p-3">
                    <pre className="text-slate-300 text-sm">{problem.examples[0].output}</pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Console Output */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Console output</h3>
              <div className="bg-slate-800 rounded-lg p-4 min-h-[100px]">
                {isRunning ? (
                  <div className="flex items-center text-blue-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                    Running...
                  </div>
                ) : output ? (
                  <pre className="text-green-400 text-sm">{output}</pre>
                ) : (
                  <div className="text-slate-500 text-sm">No output yet</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Code Editor and Test Cases */}
        <div className="w-1/2 bg-slate-900 flex flex-col">
          {/* Code Editor */}
          <div className="flex-1 border-b border-slate-700">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <select className="bg-slate-700 text-white text-sm rounded px-2 py-1">
                    <option>C++</option>
                    <option>Python</option>
                    <option>JavaScript</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCode('')}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="h-full">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-slate-900 text-slate-100 p-4 font-mono text-sm resize-none focus:outline-none"
                style={{ minHeight: '400px' }}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Test Cases Panel */}
          <div className="h-64 border-t border-slate-700">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <button className="text-blue-400 font-medium border-b-2 border-blue-400 pb-1">
                    TEST CASES
                  </button>
                  <button className="text-slate-400 hover:text-white">
                    CUSTOM
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={runAllTests}
                    disabled={isRunning}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                  >
                    <Play className="h-3 w-3" />
                    <span>PLAY ALL TESTCASES</span>
                  </button>
                  <button
                    onClick={submitSolution}
                    disabled={isRunning}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 text-white px-4 py-1 rounded text-sm font-medium flex items-center space-x-1"
                  >
                    <Send className="h-3 w-3" />
                    <span>SUBMIT</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex h-full">
              {/* Test Case List */}
              <div className="w-1/3 border-r border-slate-700">
                {testCases.map((test, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedTest(index)}
                    className={`p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-800 ${
                      selectedTest === index ? 'bg-slate-800 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400">0{index + 1}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          runTest(index)
                        }}
                        className="text-blue-400 hover:text-blue-300 p-1"
                      >
                        <Play className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-cyan-400 text-sm font-medium">{test.name}</div>
                  </div>
                ))}
              </div>

              {/* Test Case Details */}
              <div className="w-2/3 p-4">
                <div className="mb-4">
                  <h4 className="text-slate-400 text-sm mb-2">Input:</h4>
                  <div className="bg-slate-800 rounded p-2">
                    <pre className="text-slate-300 text-xs">{testCases[selectedTest].input}</pre>
                  </div>
                </div>
                <div>
                  <h4 className="text-slate-400 text-sm mb-2">Expected Output:</h4>
                  <div className="bg-slate-800 rounded p-2">
                    <pre className="text-slate-300 text-xs">{testCases[selectedTest].expectedOutput}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}