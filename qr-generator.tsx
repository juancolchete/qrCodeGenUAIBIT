"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, QrCode, Palette, X } from "lucide-react"
import QRCode from "qrcode"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function QRGenerator() {
  const [inputValue, setInputValue] = useState("")
  const [qrCodeDataURL, setQrCodeDataURL] = useState("")
  const [qrCodeSVG, setQrCodeSVG] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [communities, setCommunities] = useState<any[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null)
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true)
  const [noLogo, setNoLogo] = useState(false)
  const [foregroundColor, setForegroundColor] = useState("#000000")
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF")
  const [customImage, setCustomImage] = useState<string | null>(null)
  const [customImageFile, setCustomImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<"L" | "M" | "Q" | "H">("M")

  // Predefined color presets
  const colorPresets = [
    { name: "Classic", fg: "#000000", bg: "#FFFFFF" },
    { name: "Blue", fg: "#1E40AF", bg: "#FFFFFF" },
    { name: "Green", fg: "#059669", bg: "#FFFFFF" },
    { name: "Purple", fg: "#7C3AED", bg: "#FFFFFF" },
    { name: "Red", fg: "#DC2626", bg: "#FFFFFF" },
    { name: "Dark Mode", fg: "#FFFFFF", bg: "#1F2937" },
    { name: "Ocean", fg: "#0EA5E9", bg: "#F0F9FF" },
    { name: "Forest", fg: "#16A34A", bg: "#F0FDF4" },
  ]

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await fetch("https://raw.githubusercontent.com/UAIBIT/OBTC/refs/heads/main/communities.json")
        const data = await response.json()
        setCommunities(data)

        const uaibitCommunity = data.find(
          (community: any) =>
            community.name?.toLowerCase().includes("uaibit") || community.title?.toLowerCase().includes("uaibit"),
        )

        if (uaibitCommunity) {
          setSelectedCommunity(uaibitCommunity)
        } else if (data.length > 0) {
          setSelectedCommunity(data[0])
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
    if (value === "no-logo") {
      setNoLogo(true)
      setSelectedCommunity(null)
      setCustomImage(null)
    } else if (value === "custom-image") {
      setNoLogo(false)
      setSelectedCommunity(null)
      // Custom image is already set
    } else {
      setNoLogo(false)
      setCustomImage(null)
      const community = communities.find((c, index) => index.toString() === value)
      if (community) {
        setSelectedCommunity(community)
      }
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setCustomImage(result)
          setCustomImageFile(file)
          setSelectedCommunity(null)
          setNoLogo(false)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const removeCustomImage = () => {
    setCustomImage(null)
    setCustomImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const applyColorPreset = (preset: { fg: string; bg: string }) => {
    setForegroundColor(preset.fg)
    setBackgroundColor(preset.bg)
  }

  const generateQRCodeSVG = async () => {
    if (!inputValue.trim()) return ""

    try {
      // Generate QR code as SVG string
      const svgString = await QRCode.toString(inputValue, {
        type: "svg",
        width: 400,
        margin: 4,
        color: {
          dark: foregroundColor,
          light: backgroundColor,
        },
        errorCorrectionLevel: errorCorrectionLevel,
      })

      // If no logo, return the SVG as is
      if (noLogo) {
        return svgString
      }

      // Determine which logo to use
      const logoUrl =
        customImage ||
        selectedCommunity?.logo ||
        selectedCommunity?.image ||
        selectedCommunity?.icon ||
        "/uaibitlogo.svg"

      // Parse the SVG and add logo
      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(svgString, "image/svg+xml")
      const svgElement = svgDoc.querySelector("svg")

      if (svgElement) {
        // Add logo group
        const logoGroup = svgDoc.createElementNS("http://www.w3.org/2000/svg", "g")

        // Get SVG dimensions
        const viewBox = svgElement.getAttribute("viewBox")?.split(" ") || ["0", "0", "400", "400"]
        const centerX = Number.parseFloat(viewBox[2]) / 2
        const centerY = Number.parseFloat(viewBox[3]) / 2
        const logoSize = 80

        // Create white background circle
        const bgCircle = svgDoc.createElementNS("http://www.w3.org/2000/svg", "circle")
        bgCircle.setAttribute("cx", centerX.toString())
        bgCircle.setAttribute("cy", centerY.toString())
        bgCircle.setAttribute("r", (logoSize / 2 + 8).toString())
        bgCircle.setAttribute("fill", "#FFFFFF")
        bgCircle.setAttribute("stroke", isLightColor(backgroundColor) ? "#E5E7EB" : "#374151")
        bgCircle.setAttribute("stroke-width", "1")

        // Create clip path for rounded logo
        const clipPath = svgDoc.createElementNS("http://www.w3.org/2000/svg", "clipPath")
        clipPath.setAttribute("id", "logo-clip")
        const clipCircle = svgDoc.createElementNS("http://www.w3.org/2000/svg", "circle")
        clipCircle.setAttribute("cx", centerX.toString())
        clipCircle.setAttribute("cy", centerY.toString())
        clipCircle.setAttribute("r", (logoSize / 2).toString())
        clipPath.appendChild(clipCircle)

        // Create image element
        const imageElement = svgDoc.createElementNS("http://www.w3.org/2000/svg", "image")
        imageElement.setAttribute("href", logoUrl)
        imageElement.setAttribute("x", (centerX - logoSize / 2).toString())
        imageElement.setAttribute("y", (centerY - logoSize / 2).toString())
        imageElement.setAttribute("width", logoSize.toString())
        imageElement.setAttribute("height", logoSize.toString())
        imageElement.setAttribute("clip-path", "url(#logo-clip)")

        // Add elements to group and SVG
        logoGroup.appendChild(bgCircle)
        svgElement.appendChild(clipPath)
        logoGroup.appendChild(imageElement)
        svgElement.appendChild(logoGroup)

        return new XMLSerializer().serializeToString(svgDoc)
      }

      return svgString
    } catch (error) {
      console.error("Error generating SVG:", error)
      return ""
    }
  }

  const generateQRCode = async () => {
    if (!inputValue.trim()) return

    setIsGenerating(true)

    try {
      // Generate PNG version
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = 400
      canvas.height = 400

      await QRCode.toCanvas(canvas, inputValue, {
        width: 400,
        margin: 4,
        color: {
          dark: foregroundColor,
          light: backgroundColor,
        },
        errorCorrectionLevel: errorCorrectionLevel,
      })

      if (noLogo) {
        const dataURL = canvas.toDataURL("image/png", 1.0)
        setQrCodeDataURL(dataURL)

        // Generate SVG version
        const svg = await generateQRCodeSVG()
        setQrCodeSVG(svg)

        setIsGenerating(false)
        return
      }

      const logoUrl =
        customImage ||
        selectedCommunity?.logo ||
        selectedCommunity?.image ||
        selectedCommunity?.icon ||
        "/uaibitlogo.svg"

      const logo = new Image()
      logo.crossOrigin = "anonymous"
      logo.onload = async () => {
        const logoSize = 80
        const logoX = (canvas.width - logoSize) / 2
        const logoY = (canvas.height - logoSize) / 2

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"

        const logoBackgroundColor =
          backgroundColor === "#FFFFFF" || isLightColor(backgroundColor) ? "#FFFFFF" : "#FFFFFF"
        ctx.fillStyle = logoBackgroundColor
        ctx.beginPath()
        ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 8, 0, 2 * Math.PI)
        ctx.fill()

        ctx.strokeStyle = isLightColor(backgroundColor) ? "#E5E7EB" : "#374151"
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.save()
        ctx.beginPath()
        ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, 2 * Math.PI)
        ctx.clip()

        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
        ctx.restore()

        const dataURL = canvas.toDataURL("image/png", 1.0)
        setQrCodeDataURL(dataURL)

        // Generate SVG version
        const svg = await generateQRCodeSVG()
        setQrCodeSVG(svg)

        setIsGenerating(false)
      }

      logo.onerror = async () => {
        const fallbackLogo = new Image()
        fallbackLogo.crossOrigin = "anonymous"
        fallbackLogo.onload = async () => {
          const logoSize = 80
          const logoX = (canvas.width - logoSize) / 2
          const logoY = (canvas.height - logoSize) / 2

          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"

          const logoBackgroundColor =
            backgroundColor === "#FFFFFF" || isLightColor(backgroundColor) ? "#FFFFFF" : "#FFFFFF"
          ctx.fillStyle = logoBackgroundColor
          ctx.beginPath()
          ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 8, 0, 2 * Math.PI)
          ctx.fill()

          ctx.strokeStyle = isLightColor(backgroundColor) ? "#E5E7EB" : "#374151"
          ctx.lineWidth = 1
          ctx.stroke()

          ctx.save()
          ctx.beginPath()
          ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, 2 * Math.PI)
          ctx.clip()

          ctx.drawImage(fallbackLogo, logoX, logoY, logoSize, logoSize)
          ctx.restore()

          const dataURL = canvas.toDataURL("image/png", 1.0)
          setQrCodeDataURL(dataURL)

          // Generate SVG version
          const svg = await generateQRCodeSVG()
          setQrCodeSVG(svg)

          setIsGenerating(false)
        }

        fallbackLogo.onerror = async () => {
          const dataURL = canvas.toDataURL("image/png", 1.0)
          setQrCodeDataURL(dataURL)

          // Generate SVG version
          const svg = await generateQRCodeSVG()
          setQrCodeSVG(svg)

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

  const isLightColor = (color: string) => {
    const hex = color.replace("#", "")
    const r = Number.parseInt(hex.substr(0, 2), 16)
    const g = Number.parseInt(hex.substr(2, 2), 16)
    const b = Number.parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128
  }

  const downloadQRCode = () => {
    if (!qrCodeDataURL) return

    const link = document.createElement("a")
    link.download = `uaibit-qr-${Date.now()}.png`
    link.href = qrCodeDataURL
    link.click()
  }

  const downloadQRCodeSVG = () => {
    if (!qrCodeSVG) return

    const blob = new Blob([qrCodeSVG], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.download = `uaibit-qr-${Date.now()}.svg`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
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
          <p className="text-gray-600">Generate QR codes with custom colors, logos, and export formats</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Generate QR Code
            </CardTitle>
            <CardDescription>Enter any text, URL, or data to generate a customized QR code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {/* Custom Image Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="custom-image">Custom Logo Image</Label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      ref={fileInputRef}
                      id="custom-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload your own logo image (PNG, JPG, SVG)</p>
                  </div>
                  {customImage && (
                    <Button variant="outline" size="sm" onClick={removeCustomImage} className="shrink-0 bg-transparent">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {customImage && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={customImage || "/placeholder.svg"}
                      alt="Custom logo preview"
                      className="w-12 h-12 object-contain rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Custom Image Uploaded</p>
                      <p className="text-xs text-gray-500">{customImageFile?.name}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="community-select">Or Select Community Logo</Label>
                <Select
                  value={
                    customImage
                      ? "custom-image"
                      : noLogo
                        ? "no-logo"
                        : selectedCommunity
                          ? communities.findIndex((c) => c === selectedCommunity).toString()
                          : ""
                  }
                  onValueChange={handleCommunityChange}
                  disabled={isLoadingCommunities}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingCommunities ? "Loading communities..." : "Select a community"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-logo">No Logo</SelectItem>
                    {customImage && <SelectItem value="custom-image">Custom Uploaded Image</SelectItem>}
                    {communities.map((community, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {community.name || community.title || community.id || `Community ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Choose a pre-defined community logo or use your custom image</p>
              </div>

              {/* Color Customization Section */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <Label className="text-sm font-medium">Color Customization</Label>
                </div>

                {/* Color Presets */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Quick Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((preset, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => applyColorPreset(preset)}
                        className="h-8 px-3 text-xs"
                        style={{
                          backgroundColor: preset.bg,
                          color: preset.fg,
                          borderColor: preset.fg,
                        }}
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fg-color" className="text-sm">
                      Foreground Color
                    </Label>
                    <div className="flex gap-2 items-center">
                      <input
                        id="fg-color"
                        type="color"
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        placeholder="#000000"
                        className="text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500">QR code pattern color</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bg-color" className="text-sm">
                      Background Color
                    </Label>
                    <div className="flex gap-2 items-center">
                      <input
                        id="bg-color"
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        placeholder="#FFFFFF"
                        className="text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500">QR code background color</p>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="flex items-center gap-3 p-3 bg-white rounded border">
                  <div
                    className="w-12 h-12 rounded border-2 flex items-center justify-center"
                    style={{
                      backgroundColor: backgroundColor,
                      borderColor: foregroundColor,
                    }}
                  >
                    <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: foregroundColor }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Color Preview</p>
                    <p className="text-xs text-gray-500">
                      Foreground: {foregroundColor} | Background: {backgroundColor}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Correction Level Selector */}
              <div className="space-y-2">
                <Label htmlFor="error-correction">Error Correction Level</Label>
                <Select
                  value={errorCorrectionLevel}
                  onValueChange={(value: "L" | "M" | "Q" | "H") => setErrorCorrectionLevel(value)}
                >
                  <SelectTrigger id="error-correction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Low (L) - 7% Recovery</span>
                        <span className="text-xs text-gray-500">Least dense, minimal damage tolerance</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="M">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Medium (M) - 15% Recovery</span>
                        <span className="text-xs text-gray-500">Balanced density and reliability</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Q">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Quartile (Q) - 25% Recovery</span>
                        <span className="text-xs text-gray-500">Higher density, better damage tolerance</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="H">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">High (H) - 30% Recovery</span>
                        <span className="text-xs text-gray-500">Densest pattern, maximum damage tolerance</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Higher levels create denser QR codes but can recover from more damage or obstruction
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
            {(selectedCommunity || noLogo || customImage) && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded border flex items-center justify-center">
                    {customImage ? (
                      <img
                        src={customImage || "/placeholder.svg"}
                        alt="Custom logo"
                        className="w-6 h-6 object-contain"
                      />
                    ) : noLogo ? (
                      <QrCode className="w-6 h-6 text-gray-400" />
                    ) : selectedCommunity.logo || selectedCommunity.image || selectedCommunity.icon ? (
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
                      {customImage
                        ? "Custom Image"
                        : noLogo
                          ? "No Logo"
                          : selectedCommunity.name || selectedCommunity.title || "Unknown Community"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {noLogo
                        ? "QR code will be generated without center logo"
                        : customImage
                          ? "Your custom image will appear in QR code center"
                          : "Logo will appear in QR code center"}
                    </p>
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
              <CardDescription>Your customized QR code is ready for download</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                <img src={qrCodeDataURL || "/placeholder.svg"} alt="Generated QR Code" className="max-w-full h-auto" />
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button onClick={downloadQRCode} variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Download className="w-4 h-4" />
                  Download PNG
                </Button>
                <Button
                  onClick={downloadQRCodeSVG}
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Download className="w-4 h-4" />
                  Download SVG
                </Button>
                <Button onClick={generateQRCode} variant="outline">
                  Regenerate
                </Button>
              </div>
              <p className="text-sm text-gray-500">Encoded value: {inputValue}</p>
              <p className="text-xs text-gray-400">
                Colors: {foregroundColor} on {backgroundColor}
              </p>
              <p className="text-xs text-gray-400">
                Error Correction: {errorCorrectionLevel} (
                {errorCorrectionLevel === "L"
                  ? "7%"
                  : errorCorrectionLevel === "M"
                    ? "15%"
                    : errorCorrectionLevel === "Q"
                      ? "25%"
                      : "30%"}{" "}
                recovery)
              </p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• PNG: High-quality raster image (recommended for print)</p>
                <p>• SVG: Scalable vector format (recommended for web and infinite scaling)</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hidden canvas for QR code generation */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  )
}
