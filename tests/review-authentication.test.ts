import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity environment
let mockTxSender = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG" // Guest/Reviewer
const mockPropertyAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockCheckInDate = 20230101
const mockBlockHeight = 123456

// Mock state
let mockState = {
  admin: mockTxSender,
  verifiedStays: {},
  reviews: {},
}

// Mock contract functions
const contractFunctions = {
  "verify-stay": (guest, property, checkInDate) => {
    if (mockTxSender !== mockState.admin) {
      return { type: "err", value: 3 }
    }
    
    const key = `${guest}-${property}-${checkInDate}`
    mockState.verifiedStays[key] = true
    return { type: "ok", value: true }
  },
  
  "submit-review": (property, rating, reviewText, stayCheckInDate) => {
    const reviewer = mockTxSender
    const key = `${reviewer}-${property}-${stayCheckInDate}`
    
    if (!mockState.verifiedStays[key]) {
      return { type: "err", value: 1 }
    }
    
    if (rating < 1 || rating > 5) {
      return { type: "err", value: 2 }
    }
    
    const reviewKey = `${reviewer}-${property}-${mockBlockHeight}`
    mockState.reviews[reviewKey] = {
      rating,
      "review-text": reviewText,
      authenticated: true,
      "stay-check-in-date": stayCheckInDate,
    }
    
    return { type: "ok", value: true }
  },
  
  "is-review-authenticated": (reviewer, property, timestamp) => {
    const key = `${reviewer}-${property}-${timestamp}`
    return mockState.reviews[key]?.authenticated || false
  },
  
  "get-review-details": (reviewer, property, timestamp) => {
    const key = `${reviewer}-${property}-${timestamp}`
    return mockState.reviews[key] || null
  },
  
  "transfer-admin": (newAdmin) => {
    if (mockTxSender !== mockState.admin) {
      return { type: "err", value: 3 }
    }
    
    mockState.admin = newAdmin
    return { type: "ok", value: true }
  },
}

describe("Review Authentication Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    mockState = {
      admin: mockTxSender,
      verifiedStays: {},
      reviews: {},
    }
    mockTxSender = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
  })
  
  it("should submit a review successfully when guest stayed at property", () => {
    // First verify the stay
    mockState.admin = mockTxSender
    contractFunctions["verify-stay"](mockTxSender, mockPropertyAddress, mockCheckInDate)
    
    const result = contractFunctions["submit-review"](
        mockPropertyAddress,
        4,
        "Great hotel with excellent service!",
        mockCheckInDate,
    )
    
    expect(result.type).toBe("ok")
    
    const key = `${mockTxSender}-${mockPropertyAddress}-${mockBlockHeight}`
    expect(mockState.reviews[key].rating).toBe(4)
    expect(mockState.reviews[key]["review-text"]).toBe("Great hotel with excellent service!")
    expect(mockState.reviews[key].authenticated).toBe(true)
  })
  
  it("should fail to submit a review when guest did not stay at property", () => {
    // Don't verify the stay
    const result = contractFunctions["submit-review"](
        mockPropertyAddress,
        4,
        "Great hotel with excellent service!",
        mockCheckInDate,
    )
    
    expect(result.type).toBe("err")
    expect(result.value).toBe(1)
  })
  
  it("should fail to submit a review with invalid rating", () => {
    // First verify the stay
    mockState.admin = mockTxSender
    contractFunctions["verify-stay"](mockTxSender, mockPropertyAddress, mockCheckInDate)
    
    const result = contractFunctions["submit-review"](
        mockPropertyAddress,
        6, // Invalid rating (> 5)
        "Great hotel with excellent service!",
        mockCheckInDate,
    )
    
    expect(result.type).toBe("err")
    expect(result.value).toBe(2)
  })
  
  it("should correctly verify if a review is authenticated", () => {
    // First verify the stay
    mockState.admin = mockTxSender
    contractFunctions["verify-stay"](mockTxSender, mockPropertyAddress, mockCheckInDate)
    
    contractFunctions["submit-review"](mockPropertyAddress, 4, "Great hotel with excellent service!", mockCheckInDate)
    
    const isAuthenticated = contractFunctions["is-review-authenticated"](
        mockTxSender,
        mockPropertyAddress,
        mockBlockHeight,
    )
    
    expect(isAuthenticated).toBe(true)
    
    const isOtherAuthenticated = contractFunctions["is-review-authenticated"](
        "ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0", // Different reviewer
        mockPropertyAddress,
        mockBlockHeight,
    )
    
    expect(isOtherAuthenticated).toBe(false)
  })
  
  it("should return review details correctly", () => {
    // First verify the stay
    mockState.admin = mockTxSender
    contractFunctions["verify-stay"](mockTxSender, mockPropertyAddress, mockCheckInDate)
    
    contractFunctions["submit-review"](mockPropertyAddress, 4, "Great hotel with excellent service!", mockCheckInDate)
    
    const details = contractFunctions["get-review-details"](mockTxSender, mockPropertyAddress, mockBlockHeight)
    
    expect(details.rating).toBe(4)
    expect(details["review-text"]).toBe("Great hotel with excellent service!")
    expect(details.authenticated).toBe(true)
    expect(details["stay-check-in-date"]).toBe(mockCheckInDate)
  })
  
  it("should transfer admin rights successfully", () => {
    const newAdmin = "ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0"
    const result = contractFunctions["transfer-admin"](newAdmin)
    
    expect(result.type).toBe("ok")
    expect(mockState.admin).toBe(newAdmin)
  })
})
