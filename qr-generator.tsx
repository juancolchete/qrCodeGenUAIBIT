"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, QrCode } from "lucide-react"
import QRCode from "qrcode"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function QRGenerator() {
  const [inputValue, setInputValue] = useState("")
  const [qrCodeDataURL, setQrCodeDataURL] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [communities, setCommunities] = useState<any[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null)
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true)

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await fetch("https://raw.githubusercontent.com/UAIBIT/OBTC/refs/heads/main/communities.json")
        const data = await response.json()
        setCommunities(data)

        // Find and set UAIBIT as default
        const uaibitCommunity = data.find(
          (community: any) =>
            community.name?.toLowerCase().includes("uaibit") || community.title?.toLowerCase().includes("uaibit"),
        )

        if (uaibitCommunity) {
          setSelectedCommunity(uaibitCommunity)
          // Don't populate inputValue automatically
        } else if (data.length > 0) {
          setSelectedCommunity(data[0])
          // Don't populate inputValue automatically
        }
      } catch (error) {
        console.error("Error fetching communities:", error)
      } finally {
        setIsLoadingCommunities(false)
      }
    }

    fetchCommunities()
  }, [])

  const handleCommunityChange = (value: string) => {
    const community = communities.find((c, index) => index.toString() === value)
    if (community) {
      setSelectedCommunity(community)
      // Don't automatically populate inputValue - let user fill it freely
    }
  }

  const generateQRCode = async () => {
    if (!inputValue.trim()) return

    setIsGenerating(true)

    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas size to higher resolution
      canvas.width = 400 // Increased from 300 to 400
      canvas.height = 400 // Increased from 300 to 400

      // Generate QR code with higher resolution
      await QRCode.toCanvas(canvas, inputValue, {
        width: 400, // Increased from 300 to 400
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H", // High error correction to accommodate logo
      })

      // Determine which logo to use
      const logoUrl =
        selectedCommunity?.logo || selectedCommunity?.image || selectedCommunity?.icon || "/uaibitlogo.svg"

      // Load and draw the logo with improved resolution
      const logo = new Image()
      logo.crossOrigin = "anonymous"
      logo.onload = () => {
        // Increase logo size for better resolution
        const logoSize = 80 // Increased from 60 to 80
        const logoX = (canvas.width - logoSize) / 2
        const logoY = (canvas.height - logoSize) / 2

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"

        // Draw white background circle for logo with better padding
        ctx.fillStyle = "#FFFFFF"
        ctx.beginPath()
        ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 8, 0, 2 * Math.PI)
        ctx.fill()

        // Add subtle border around the logo background
        ctx.strokeStyle = "#E5E7EB"
        ctx.lineWidth = 1
        ctx.stroke()

        // Create a clipping path for rounded logo
        ctx.save()
        ctx.beginPath()
        ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, 2 * Math.PI)
        ctx.clip()

        // Draw logo with better quality
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
        ctx.restore()

        // Convert canvas to data URL with higher quality
        const dataURL = canvas.toDataURL("image/png", 1.0)
        setQrCodeDataURL(dataURL)
        setIsGenerating(false)
      }

      logo.onerror = () => {
        // If community logo fails to load, try UAIBIT logo as fallback
        const fallbackLogo = new Image()
        fallbackLogo.crossOrigin = "anonymous"
        fallbackLogo.onload = () => {
          const logoSize = 80 // Increased size for fallback too
          const logoX = (canvas.width - logoSize) / 2
          const logoY = (canvas.height - logoSize) / 2

          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"

          // Draw white background circle for logo
          ctx.fillStyle = "#FFFFFF"
          ctx.beginPath()
          ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 8, 0, 2 * Math.PI)
          ctx.fill()

          // Add subtle border
          ctx.strokeStyle = "#E5E7EB"
          ctx.lineWidth = 1
          ctx.stroke()

          // Create a clipping path for rounded logo
          ctx.save()
          ctx.beginPath()
          ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, 2 * Math.PI)
          ctx.clip()

          // Draw fallback logo
          ctx.drawImage(fallbackLogo, logoX, logoY, logoSize, logoSize)
          ctx.restore()

          const dataURL = canvas.toDataURL("image/png", 1.0)
          setQrCodeDataURL(dataURL)
          setIsGenerating(false)
        }

        fallbackLogo.onerror = () => {
          // If both logos fail, just use QR code without logo
          const dataURL = canvas.toDataURL("image/png", 1.0)
          setQrCodeDataURL(dataURL)
          setIsGenerating(false)
        }

        fallbackLogo.src = "/uaibitlogo.svg"
      }

      logo.src = logoUrl
    } catch (error) {
      console.error("Error generating QR code:", error)
      setIsGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeDataURL) return

    const link = document.createElement("a")
    link.download = `uaibit-qr-${Date.now()}.png`
    link.href = qrCodeDataURL
    link.click()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      generateQRCode()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">UAIBIT QR Generator</h1>
          <p className="text-gray-600">Generate QR codes with the UAIBIT logo embedded</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Generate QR Code
            </CardTitle>
            <CardDescription>Enter any text, URL, or data to generate a QR code with the UAIBIT logo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="community-select">Select Community (for logo)</Label>
                <Select
                  value={selectedCommunity ? communities.findIndex((c) => c === selectedCommunity).toString() : ""}
                  onValueChange={handleCommunityChange}
                  disabled={isLoadingCommunities}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingCommunities ? "Loading communities..." : "Select a community"} />
                  </SelectTrigger>
                  <SelectContent>
                    {communities.map((community, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {community.name || community.title || community.id || `Community ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  This determines which logo appears in the center of your QR code
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr-input">QR Code Data</Label>
                <Input
                  id="qr-input"
                  type="text"
                  placeholder="Enter text, URL, or any data to encode..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">Enter any data you want to encode in the QR code</p>
              </div>
            </div>
            <Button
              onClick={generateQRCode}
              disabled={!inputValue.trim() || isGenerating || isLoadingCommunities}
              className="w-full"
              size="lg"
            >
              {isGenerating ? "Generating..." : isLoadingCommunities ? "Loading..." : "Generate QR Code"}
            </Button>
            {selectedCommunity && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded border flex items-center justify-center">
                    {selectedCommunity.logo || selectedCommunity.image || selectedCommunity.icon ? (
                      <img
                        src={selectedCommunity.logo || selectedCommunity.image || selectedCommunity.icon}
                        alt="Community logo"
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/uaibitlogo.svg"
                        }}
                      />
                    ) : (
                      <img src="/uaibitlogo.svg" alt="Default logo" className="w-6 h-6 object-contain" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {selectedCommunity.name || selectedCommunity.title || "Unknown Community"}
                    </p>
                    <p className="text-xs text-gray-500">Logo will appear in QR code center</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {qrCodeDataURL && (
          <Card>
            <CardHeader>
              <CardTitle>Generated QR Code</CardTitle>
              <CardDescription>Your QR code with UAIBIT logo is ready</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                <img src={qrCodeDataURL || "/placeholder.svg"} alt="Generated QR Code" className="max-w-full h-auto" />
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={downloadQRCode} variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Download className="w-4 h-4" />
                  Download PNG
                </Button>
                <Button onClick={generateQRCode} variant="outline">
                  Regenerate
                </Button>
              </div>
              <p className="text-sm text-gray-500">Encoded value: {inputValue}</p>
            </CardContent>
          </Card>
        )}

        {/* Hidden canvas for QR code generation */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  )
}
