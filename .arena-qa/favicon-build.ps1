Add-Type -AssemblyName System.Drawing
$src=[System.Drawing.Bitmap]::FromFile('C:/Users/DEV-BT/.codex/generated_images/01a1a2c9-0821-7b02-9ada-17106a0c19e0/exec-933f134e-dcbf-4dcd-a32e-e24c3110a6b8.png')
$left=$src.Width; $top=$src.Height; $right=0; $bottom=0
for($y=0;$y -lt $src.Height;$y++){for($x=0;$x -lt $src.Width;$x++){if($src.GetPixel($x,$y).A -gt 24){$left=[Math]::Min($left,$x);$right=[Math]::Max($right,$x);$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y)}}}
$crop=New-Object System.Drawing.Rectangle($left,$top,($right-$left+1),($bottom-$top+1))
foreach($size in @(16,32)){
 $out=New-Object System.Drawing.Bitmap($size,$size)
 $g=[System.Drawing.Graphics]::FromImage($out)
 $g.Clear([System.Drawing.Color]::Transparent)
 $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
 $g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
 $padding=$size/16
 $width=$size-2*$padding; $height=$width*$crop.Height/$crop.Width
 $rect=New-Object System.Drawing.RectangleF($padding,(($size-$height)/2),$width,$height)
 $g.DrawImage($src,$rect,$crop,[System.Drawing.GraphicsUnit]::Pixel)
 $out.Save((Join-Path (Get-Location) "public/brand/favicon-m-v2-$size.png"),[System.Drawing.Imaging.ImageFormat]::Png)
 $g.Dispose(); $out.Dispose()
}
$src.Dispose()
$pngs=@([IO.File]::ReadAllBytes((Join-Path (Get-Location) 'public/brand/favicon-m-v2-16.png')),[IO.File]::ReadAllBytes((Join-Path (Get-Location) 'public/brand/favicon-m-v2-32.png')))
$stream=[IO.File]::Create((Join-Path (Get-Location) 'public/brand/favicon-m-v2.ico'))
$writer=New-Object IO.BinaryWriter($stream)
$writer.Write([UInt16]0);$writer.Write([UInt16]1);$writer.Write([UInt16]2)
$offset=38
for($i=0;$i -lt 2;$i++){$size=@(16,32)[$i];$writer.Write([byte]$size);$writer.Write([byte]$size);$writer.Write([byte]0);$writer.Write([byte]0);$writer.Write([UInt16]1);$writer.Write([UInt16]32);$writer.Write([UInt32]$pngs[$i].Length);$writer.Write([UInt32]$offset);$offset+=$pngs[$i].Length}
foreach($png in $pngs){$writer.Write([byte[]]$png)}
$writer.Dispose();$stream.Dispose()
