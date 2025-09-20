import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response = await fetch("http://localhost:4000/api/polls/mock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Mock poll creation proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "PROXY_ERROR",
        message: "Failed to create mock poll",
      },
      { status: 500 }
    );
  }
}