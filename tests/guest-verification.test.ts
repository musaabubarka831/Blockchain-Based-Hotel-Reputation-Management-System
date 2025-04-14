import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity environment
let mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" // Property
const mockGuestAddress = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
const mockCheckInDate = 20230101
const mockCheckOutDate = 20230105
const mockStayId = "123e4567-e89b-12d3-a456-426614174000"

// Mock state
let mockState = {
  admin: mockTxSender,
  verifiedProperties: {},
  guestStays: {},
}

// Mock contract functions
const contractFunctions = {
  "verify-property": (property) => {
    if (mockTxSender !== mockState.admin) {
      return { type: "err", value: 3 }
    }
    
    mockState.verifiedProperties[property] = true
    return { type: "ok", value: true }
  },
  
  "register-stay": (guest, checkInDate, checkOutDate, stayId) => {
    const property = mockTxSender
    
    if (!mockState.verifiedProperties[property]) {
      return { type: "err", value: 1 }
    }
    
    const key = `${guest}-${property}-${checkInDate}`
    mockState.guestStays[key] = {
      "check-out-date": checkOutDate,
      "stay-confirmed": true,
      "stay-id": stayId,
    }
    
    return { type: "ok", value: true }
  },
  
  "verify-stay": (guest, property, checkInDate) => {
    const key = `${guest}-${property}-${checkInDate}`
    return mockState.guestStays[key]?.["stay-confirmed"] || false
  },
  
  "get-stay-details": (guest, property, checkInDate) => {
    const key = `${guest}-${property}-${checkInDate}`
    return mockState.guestStays[key] || null
  },
  
  "transfer-admin": (newAdmin) => {
    if (mockTxSender !== mockState.admin) {
      return { type: "err", value: 2 }
    }
    
    mockState.admin = newAdmin
    return { type: "ok", value: true }
  },
}

describe("Guest Verification Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    mockState = {
      admin: mockTxSender,
      verifiedProperties: {},
      guestStays: {},
    }
    mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  })
  
  it("should register a guest stay successfully when called by verified property", () => {
    // First verify the property
    contractFunctions["verify-property"](mockTxSender)
    
    const result = contractFunctions["register-stay"](mockGuestAddress, mockCheckInDate, mockCheckOutDate, mockStayId)
    
    expect(result.type).toBe("ok")
    
    const key = `${mockGuestAddress}-${mockTxSender}-${mockCheckInDate}`
    expect(mockState.guestStays[key]["stay-confirmed"]).toBe(true)
    expect(mockState.guestStays[key]["check-out-date"]).toBe(mockCheckOutDate)
    expect(mockState.guestStays[key]["stay-id"]).toBe(mockStayId)
  })
  
  it("should fail to register a stay when property is not verified", () => {
    // Don't verify the property
    const result = contractFunctions["register-stay"](mockGuestAddress, mockCheckInDate, mockCheckOutDate, mockStayId)
    
    expect(result.type).toBe("err")
    expect(result.value).toBe(1)
  })
  
  it("should correctly verify if a guest stayed at a property", () => {
    // First verify the property
    contractFunctions["verify-property"](mockTxSender)
    
    contractFunctions["register-stay"](mockGuestAddress, mockCheckInDate, mockCheckOutDate, mockStayId)
    
    const isStayVerified = contractFunctions["verify-stay"](mockGuestAddress, mockTxSender, mockCheckInDate)
    
    expect(isStayVerified).toBe(true)
    
    const isOtherStayVerified = contractFunctions["verify-stay"](
        "ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0", // Different guest
        mockTxSender,
        mockCheckInDate,
    )
    
    expect(isOtherStayVerified).toBe(false)
  })
  
  it("should return stay details correctly", () => {
    // First verify the property
    contractFunctions["verify-property"](mockTxSender)
    
    contractFunctions["register-stay"](mockGuestAddress, mockCheckInDate, mockCheckOutDate, mockStayId)
    
    const details = contractFunctions["get-stay-details"](mockGuestAddress, mockTxSender, mockCheckInDate)
    
    expect(details["check-out-date"]).toBe(mockCheckOutDate)
    expect(details["stay-confirmed"]).toBe(true)
    expect(details["stay-id"]).toBe(mockStayId)
  })
  
  it("should transfer admin rights successfully", () => {
    const newAdmin = "ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0"
    const result = contractFunctions["transfer-admin"](newAdmin)
    
    expect(result.type).toBe("ok")
    expect(mockState.admin).toBe(newAdmin)
  })
})
