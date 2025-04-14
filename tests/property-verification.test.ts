import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity environment
let mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockPropertyAddress = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
const mockBlockHeight = 123456

// Mock state
let mockState = {
  admin: mockTxSender,
  verifiedProperties: {},
}

// Mock contract functions
const contractFunctions = {
  "register-property": (name, location) => {
    if (mockTxSender !== mockState.admin) {
      return { type: "err", value: 1 }
    }
    
    mockState.verifiedProperties[mockTxSender] = {
      name,
      location,
      verified: true,
      "verification-date": mockBlockHeight,
    }
    
    return { type: "ok", value: true }
  },
  
  "is-property-verified": (property) => {
    return mockState.verifiedProperties[property]?.verified || false
  },
  
  "get-property-details": (property) => {
    return mockState.verifiedProperties[property] || null
  },
  
  "transfer-admin": (newAdmin) => {
    if (mockTxSender !== mockState.admin) {
      return { type: "err", value: 2 }
    }
    
    mockState.admin = newAdmin
    return { type: "ok", value: true }
  },
}

describe("Property Verification Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    mockState = {
      admin: mockTxSender,
      verifiedProperties: {},
    }
    mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  })
  
  it("should register a property successfully when called by admin", () => {
    const result = contractFunctions["register-property"]("Grand Hotel", "New York")
    expect(result.type).toBe("ok")
    expect(mockState.verifiedProperties[mockTxSender].name).toBe("Grand Hotel")
    expect(mockState.verifiedProperties[mockTxSender].location).toBe("New York")
    expect(mockState.verifiedProperties[mockTxSender].verified).toBe(true)
  })
  
  it("should fail to register a property when not called by admin", () => {
    mockTxSender = mockPropertyAddress // Change the sender
    const result = contractFunctions["register-property"]("Grand Hotel", "New York")
    expect(result.type).toBe("err")
    expect(result.value).toBe(1)
  })
  
  it("should correctly verify if a property is registered", () => {
    mockTxSender = mockState.admin
    contractFunctions["register-property"]("Grand Hotel", "New York")
    
    const isVerified = contractFunctions["is-property-verified"](mockTxSender)
    expect(isVerified).toBe(true)
    
    const isOtherVerified = contractFunctions["is-property-verified"](mockPropertyAddress)
    expect(isOtherVerified).toBe(false)
  })
  
  it("should return property details correctly", () => {
    mockTxSender = mockState.admin
    contractFunctions["register-property"]("Grand Hotel", "New York")
    
    const details = contractFunctions["get-property-details"](mockTxSender)
    expect(details.name).toBe("Grand Hotel")
    expect(details.location).toBe("New York")
    expect(details.verified).toBe(true)
    expect(details["verification-date"]).toBe(mockBlockHeight)
  })
  
  it("should transfer admin rights successfully", () => {
    const newAdmin = "ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0"
    const result = contractFunctions["transfer-admin"](newAdmin)
    
    expect(result.type).toBe("ok")
    expect(mockState.admin).toBe(newAdmin)
  })
})
