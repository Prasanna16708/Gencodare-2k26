Add-Type -AssemblyName System.Drawing

$width = 512
$height = 512
$bitmap = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Dark void background
$bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 4, 10, 7))
$g.FillRectangle($bgBrush, 0, 0, $width, $height)

# Glowing radial ambient
$glowPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(40, 0, 255, 102)), 24
$g.DrawEllipse($glowPen, 80, 80, 352, 352)

# Outer Silver shield / octagon border
$silverPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(220, 200, 215, 225)), 8
$points = @(
    (New-Object System.Drawing.Point 140, 40),
    (New-Object System.Drawing.Point 372, 40),
    (New-Object System.Drawing.Point 460, 130),
    (New-Object System.Drawing.Point 460, 370),
    (New-Object System.Drawing.Point 372, 460),
    (New-Object System.Drawing.Point 140, 460),
    (New-Object System.Drawing.Point 52, 370),
    (New-Object System.Drawing.Point 52, 130)
)
$g.DrawPolygon($silverPen, $points)

# Inner Green cyber shield border
$greenPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(240, 0, 255, 102)), 4
$innerPoints = @(
    (New-Object System.Drawing.Point 150, 60),
    (New-Object System.Drawing.Point 362, 60),
    (New-Object System.Drawing.Point 440, 140),
    (New-Object System.Drawing.Point 440, 360),
    (New-Object System.Drawing.Point 362, 440),
    (New-Object System.Drawing.Point 150, 440),
    (New-Object System.Drawing.Point 72, 360),
    (New-Object System.Drawing.Point 72, 140)
)
$g.DrawPolygon($greenPen, $innerPoints)

# Center FinTech Crest: Candlestick chart & Quantum Lock Nodes
# Grid lines
$gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(60, 0, 255, 102)), 1
for ($y = 120; $y -le 380; $y += 40) {
    $g.DrawLine($gridPen, 100, $y, 412, $y)
}
for ($x = 120; $x -le 380; $x += 40) {
    $g.DrawLine($gridPen, $x, 100, $x, 400)
}

# Candlestick Bars
$candlestickGreen = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 255, 102))
$candlestickSilver = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 180, 195, 210))

# Bar 1
$g.DrawLine($greenPen, 160, 240, 160, 340)
$g.FillRectangle($candlestickGreen, 150, 260, 20, 50)

# Bar 2
$g.DrawLine($silverPen, 210, 200, 210, 320)
$g.FillRectangle($candlestickSilver, 200, 220, 20, 70)

# Bar 3
$g.DrawLine($greenPen, 260, 160, 260, 300)
$g.FillRectangle($candlestickGreen, 250, 180, 20, 80)

# Bar 4
$g.DrawLine($silverPen, 310, 180, 310, 290)
$g.FillRectangle($candlestickSilver, 300, 200, 20, 50)

# Bar 5 (Rocketing upward)
$g.DrawLine($greenPen, 360, 110, 360, 260)
$g.FillRectangle($candlestickGreen, 350, 130, 20, 90)

# Ascending Neon Trendline
$trendPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 255, 255)), 5
$g.DrawLine($trendPen, 130, 330, 210, 250)
$g.DrawLine($trendPen, 210, 250, 280, 220)
$g.DrawLine($trendPen, 280, 220, 370, 120)

# Currency / Node Emblem at apex
$apexBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 255, 102))
$g.FillEllipse($apexBrush, 360, 110, 20, 20)

# Text FINTECH below
$font = New-Object System.Drawing.Font ("Impact", 28, [System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 225, 235, 245))
$stringFormat = New-Object System.Drawing.StringFormat
$stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
$g.DrawString("FINTECH", $font, $textBrush, 256, 380, $stringFormat)

$bitmap.Save("d:\24\public\icons\fintech.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bitmap.Dispose()
Write-Host "FinTech PNG icon created successfully."
