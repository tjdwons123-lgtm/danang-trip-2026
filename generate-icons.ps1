Add-Type -AssemblyName System.Drawing
$directory = Join-Path $PSScriptRoot 'icons'
[System.IO.Directory]::CreateDirectory($directory) | Out-Null
foreach ($size in @(192, 512)) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#a93f70'))
    $font = New-Object System.Drawing.Font('Arial', ($size * 0.40), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#fff8fa'))
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rectangle = New-Object System.Drawing.RectangleF(0, 0, $size, ($size * 0.92))
    $graphics.DrawString('D.', $font, $brush, $rectangle, $format)
    $pen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#ffc9aa'), ($size * 0.025))
    $graphics.DrawLine($pen, ($size * 0.32), ($size * 0.71), ($size * 0.68), ($size * 0.71))
    $bitmap.Save((Join-Path $directory "icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $pen.Dispose()
    $format.Dispose()
    $brush.Dispose()
    $font.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}
