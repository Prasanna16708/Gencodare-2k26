Add-Type -AssemblyName System.Drawing

$uploadsDir = "d:\24\server\uploads"
$publicUploads = "d:\24\public\uploads"
New-Item -ItemType Directory -Force -Path $uploadsDir | Out-Null
New-Item -ItemType Directory -Force -Path $publicUploads | Out-Null

function Create-Slide($filename, $title, $subtitle, $badge, $highlight) {
    $w = 1200
    $h = 500
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Dark cyber void gradient background
    $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
        (New-Object System.Drawing.Point 0, 0),
        (New-Object System.Drawing.Point $w, $h),
        ([System.Drawing.Color]::FromArgb(255, 6, 12, 8)),
        ([System.Drawing.Color]::FromArgb(255, 2, 4, 3))
    )
    $g.FillRectangle($bgBrush, $rect)

    # Ambient green glow
    $glowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(35, 0, 255, 102))
    $g.FillEllipse($glowBrush, 800, -100, 500, 500)
    $g.FillEllipse($glowBrush, -100, 200, 400, 400)

    # Silver metallic border
    $silverPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(180, 200, 215, 225)), 3
    $g.DrawRectangle($silverPen, 15, 15, $w - 30, $h - 30)

    # Green accent corner cuts
    $greenPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 0, 255, 102)), 4
    $g.DrawLine($greenPen, 15, 15, 80, 15)
    $g.DrawLine($greenPen, 15, 15, 15, 80)
    $g.DrawLine($greenPen, $w - 15, 15, $w - 80, 15)
    $g.DrawLine($greenPen, $w - 15, 15, $w - 15, 80)
    $g.DrawLine($greenPen, 15, $h - 15, 80, $h - 15)
    $g.DrawLine($greenPen, 15, $h - 15, 15, $h - 80)
    $g.DrawLine($greenPen, $w - 15, $h - 15, $w - 80, $h - 15)
    $g.DrawLine($greenPen, $w - 15, $h - 15, $w - 15, $h - 80)

    # Grid overlay
    $gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(25, 0, 255, 102)), 1
    for ($x = 40; $x -lt $w; $x += 60) { $g.DrawLine($gridPen, $x, 20, $x, $h - 20) }
    for ($y = 40; $y -lt $h; $y += 60) { $g.DrawLine($gridPen, 20, $y, $w - 20, $y) }

    # Badge
    $badgeFont = New-Object System.Drawing.Font ("Consolas", 14, [System.Drawing.FontStyle]::Bold)
    $badgeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 255, 102))
    $g.DrawString("◆ $badge ◆", $badgeFont, $badgeBrush, 70, 70)

    # Main Title
    $titleFont = New-Object System.Drawing.Font ("Impact", 44, [System.Drawing.FontStyle]::Regular)
    $titleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 235, 240, 245))
    $g.DrawString($title, $titleFont, $titleBrush, 70, 120)

    # Highlight Subtitle
    $hiFont = New-Object System.Drawing.Font ("Consolas", 22, [System.Drawing.FontStyle]::Bold)
    $g.DrawString($highlight, $hiFont, $badgeBrush, 70, 210)

    # Subtitle / Description
    $subFont = New-Object System.Drawing.Font ("Segoe UI", 16, [System.Drawing.FontStyle]::Regular)
    $subBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, 180, 195, 205))
    $g.DrawString($subtitle, $subFont, $subBrush, (New-Object System.Drawing.RectangleF 70, 270, 1000, 150))

    # Tech Footer watermark
    $metaFont = New-Object System.Drawing.Font ("Consolas", 11, [System.Drawing.FontStyle]::Regular)
    $metaBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(140, 150, 160, 170))
    $g.DrawString("PROTOCOL://DOOMSDAY.INTERNAL.v2026 // TERMINAL ENCRYPTED // SECTOR: PRODUCTION", $metaFont, $metaBrush, 70, 440)

    $out1 = Join-Path $uploadsDir $filename
    $out2 = Join-Path $publicUploads $filename
    $bmp.Save($out1, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save($out2, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created slide: $filename"
}

Create-Slide "slide_1.png" "DOOMSDAY HACKATHON 2026" "Welcome to the ultimate internal college crucible. 4 domains, 40 missions, 24 continuous hours. Deploy cutting-edge AI architectures to claim the championship." "DOOMSDAY COMMAND DIRECTIVE 01" "STATUS: BATTLEFIELD ACTIVE // 24 HOURS REMAINING"

Create-Slide "slide_2.png" "MISSION DISPATCH & DOMAIN ISOLATION" "Your allocated domain holds exactly 10 high-impact challenges. Formulate your solution, trigger the FIRE sequence, and secure your team workspace." "OPERATIONAL PROTOCOL 02" "SELECT PROBLEM -> ENGAGE FIRE -> LOCK OBJECTIVES"

Create-Slide "slide_3.png" "EVALUATION CRITERIA & FEEDBACK" "All submissions are assessed on Architectural Rigor, Operational Feasibility, and Scalable Impact. Complete your mid-hackathon milestone feedback via the form below." "CRITERIA GUIDELINES 03" "ENGINEERING EXCELLENCE // ETHICAL ROBUSTNESS"
