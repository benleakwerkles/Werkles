param(
  [int]$TargetSize = 2048
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$sourceDir = Join-Path $repoRoot "public\assets\draft\oddly-godly-pop-today"
$outRoot = Join-Path $repoRoot "public\assets\draft\oddly-godly-pop-today-technical"
$statusPath = Join-Path $repoRoot "foreman\artifacts\ghost_forge_pop_today_technical_status.json"

Add-Type -AssemblyName System.Drawing

$imageOpsSource = @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class PopTodayImageOps
{
    public static void ResizePng(string inputPath, string outputPath, int size)
    {
        using (var src = new Bitmap(inputPath))
        using (var dst = new Bitmap(size, size, PixelFormat.Format24bppRgb))
        using (var g = Graphics.FromImage(dst))
        {
            g.Clear(Color.Black);
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.DrawImage(src, 0, 0, size, size);
            EnsureDir(outputPath);
            dst.Save(outputPath, ImageFormat.Png);
        }
    }

    public static void HeightMap(string inputPath, string outputPath, int size)
    {
        using (var src = ResizeToBitmap(inputPath, size))
        using (var dst = new Bitmap(size, size, PixelFormat.Format24bppRgb))
        {
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    var c = src.GetPixel(x, y);
                    int lum = Luma(c);
                    dst.SetPixel(x, y, Color.FromArgb(lum, lum, lum));
                }
            }
            EnsureDir(outputPath);
            dst.Save(outputPath, ImageFormat.Png);
        }
    }

    public static void RoughnessMap(string inputPath, string outputPath, int size)
    {
        using (var src = ResizeToBitmap(inputPath, size))
        using (var dst = new Bitmap(size, size, PixelFormat.Format24bppRgb))
        {
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    var c = src.GetPixel(x, y);
                    int lum = Luma(c);
                    int rough = Clamp(225 - (lum / 2), 35, 230);
                    dst.SetPixel(x, y, Color.FromArgb(rough, rough, rough));
                }
            }
            EnsureDir(outputPath);
            dst.Save(outputPath, ImageFormat.Png);
        }
    }

    public static void NormalFromHeight(string inputPath, string outputPath, int size, double strength)
    {
        using (var src = ResizeToBitmap(inputPath, size))
        using (var dst = new Bitmap(size, size, PixelFormat.Format24bppRgb))
        {
            byte[,] height = new byte[size, size];
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    height[x, y] = (byte)Luma(src.GetPixel(x, y));
                }
            }

            for (int y = 0; y < size; y++)
            {
                int y0 = Math.Max(0, y - 1);
                int y1 = Math.Min(size - 1, y + 1);
                for (int x = 0; x < size; x++)
                {
                    int x0 = Math.Max(0, x - 1);
                    int x1 = Math.Min(size - 1, x + 1);
                    double dx = (height[x1, y] - height[x0, y]) / 255.0;
                    double dy = (height[x, y1] - height[x, y0]) / 255.0;
                    double nx = -dx * strength;
                    double ny = -dy * strength;
                    double nz = 1.0;
                    double len = Math.Sqrt(nx * nx + ny * ny + nz * nz);
                    nx /= len;
                    ny /= len;
                    nz /= len;
                    int r = Clamp((int)Math.Round((nx * 0.5 + 0.5) * 255), 0, 255);
                    int g = Clamp((int)Math.Round((ny * 0.5 + 0.5) * 255), 0, 255);
                    int b = Clamp((int)Math.Round((nz * 0.5 + 0.5) * 255), 0, 255);
                    dst.SetPixel(x, y, Color.FromArgb(r, g, b));
                }
            }
            EnsureDir(outputPath);
            dst.Save(outputPath, ImageFormat.Png);
        }
    }

    public static void WhiteKeyCutout(string inputPath, string colorOutputPath, string alphaOutputPath, int size)
    {
        using (var src = ResizeToBitmap(inputPath, size))
        using (var cutout = new Bitmap(size, size, PixelFormat.Format32bppArgb))
        using (var alpha = new Bitmap(size, size, PixelFormat.Format24bppRgb))
        {
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    var c = src.GetPixel(x, y);
                    int max = Math.Max(c.R, Math.Max(c.G, c.B));
                    int min = Math.Min(c.R, Math.Min(c.G, c.B));
                    int chroma = max - min;
                    int distanceFromWhite = Math.Min(255 - c.R, Math.Min(255 - c.G, 255 - c.B));
                    int a;
                    if (max > 232 && chroma < 28)
                    {
                        a = Clamp(distanceFromWhite * 12, 0, 255);
                    }
                    else
                    {
                        a = 255;
                    }
                    cutout.SetPixel(x, y, Color.FromArgb(a, c.R, c.G, c.B));
                    alpha.SetPixel(x, y, Color.FromArgb(a, a, a));
                }
            }
            EnsureDir(colorOutputPath);
            cutout.Save(colorOutputPath, ImageFormat.Png);
            EnsureDir(alphaOutputPath);
            alpha.Save(alphaOutputPath, ImageFormat.Png);
        }
    }

    public static void GlowAlphaCandidate(string inputPath, string alphaOutputPath, int size)
    {
        using (var src = ResizeToBitmap(inputPath, size))
        using (var alpha = new Bitmap(size, size, PixelFormat.Format24bppRgb))
        {
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    var c = src.GetPixel(x, y);
                    int max = Math.Max(c.R, Math.Max(c.G, c.B));
                    int min = Math.Min(c.R, Math.Min(c.G, c.B));
                    int lum = Luma(c);
                    int saturation = max - min;
                    int a = Clamp((saturation * 2) + lum - 55, 0, 255);
                    alpha.SetPixel(x, y, Color.FromArgb(a, a, a));
                }
            }
            EnsureDir(alphaOutputPath);
            alpha.Save(alphaOutputPath, ImageFormat.Png);
        }
    }

    private static Bitmap ResizeToBitmap(string inputPath, int size)
    {
        var src = new Bitmap(inputPath);
        var dst = new Bitmap(size, size, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(dst))
        {
            g.Clear(Color.Transparent);
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.DrawImage(src, 0, 0, size, size);
        }
        src.Dispose();
        return dst;
    }

    private static int Luma(Color c)
    {
        return Clamp((int)Math.Round((0.2126 * c.R) + (0.7152 * c.G) + (0.0722 * c.B)), 0, 255);
    }

    private static int Clamp(int value, int min, int max)
    {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    private static void EnsureDir(string outputPath)
    {
        var dir = Path.GetDirectoryName(outputPath);
        if (!String.IsNullOrWhiteSpace(dir))
        {
            Directory.CreateDirectory(dir);
        }
    }
}
"@

Add-Type -TypeDefinition $imageOpsSource -ReferencedAssemblies System.Drawing

New-Item -ItemType Directory -Force -Path $outRoot | Out-Null

$assets = @(
  @{
    id = "T1_001_WET_ASPHALT_SODIUM_LIT"
    source = "T_OG_ATL_WetAsphalt_SodiumLit_Albedo.png"
    kind = "surface"
    outDir = "surfaces"
    readiness = "PROTOTYPE_MATERIAL_SEED"
    usefulness = "Useful for wet Atlanta street lookdev and prototype ground material."
    blockers = @("Not native 2K/4K", "Not proven tileable", "PBR maps are synthetic from color, not authored")
  },
  @{
    id = "T1_006_GOOP_RESIDUE_OVERLAY"
    source = "T_OG_ATL_GoopResidueOverlay_Color.png"
    kind = "overlay_reference"
    outDir = "overlays"
    readiness = "STYLE_REFERENCE_ONLY"
    usefulness = "Useful for signature Goop color, sheen, and shape language."
    blockers = @("Not a clean tileable overlay", "No usable alpha", "Contains representational hand shape unsuitable for generic surface overlay")
  },
  @{
    id = "T2_007_WET_PUDDLE_DECALS"
    source = "D_OG_WetPuddles_Atlas.png"
    kind = "decal_reference"
    outDir = "decals"
    readiness = "CONCEPT_REFERENCE_ONLY"
    usefulness = "Useful for puddle shape, sodium-orange/cyan reflection direction, and decal art direction."
    blockers = @("No alpha", "Background is baked into the image", "Not an isolated transparent decal atlas")
  },
  @{
    id = "T2_008_GOOP_SPLATTER_DECALS"
    source = "D_OG_GoopSplatterResidue_Atlas.png"
    kind = "white_key_decal_candidate"
    outDir = "decals"
    readiness = "DECAL_CANDIDATE_SYNTH_ALPHA"
    usefulness = "Useful as first-pass Goop decal atlas after synthetic white-key alpha extraction."
    blockers = @("Synthetic alpha only", "Needs hand cleanup before production", "No emissive mask authored")
  },
  @{
    id = "T5_025_GOOP_FIREWORK_BURST"
    source = "FX_OG_GoopBurst_8x8_ColorAlpha.png"
    kind = "vfx_reference"
    outDir = "vfx"
    readiness = "VFX_CONCEPT_REFERENCE_ONLY"
    usefulness = "Useful for Goop firework color, silhouette, and particle direction."
    blockers = @("Not a true 8x8 animation sheet", "No alpha", "No frame progression")
  }
)

$results = @()

foreach ($asset in $assets) {
  $src = Join-Path $sourceDir $asset.source
  if (-not (Test-Path $src)) {
    $results += [pscustomobject]@{
      asset_id = $asset.id
      status = "missing_source"
      source = $asset.source
    }
    continue
  }

  $assetOutDir = Join-Path $outRoot $asset.outDir
  New-Item -ItemType Directory -Force -Path $assetOutDir | Out-Null
  $stem = [System.IO.Path]::GetFileNameWithoutExtension($asset.source)
  $outputs = @()

  if ($asset.kind -eq "surface") {
    $albedo = Join-Path $assetOutDir "$stem`_2048_SYNTH_UPSCALE_Albedo.png"
    $height = Join-Path $assetOutDir "$stem`_2048_SYNTH_Height.png"
    $rough = Join-Path $assetOutDir "$stem`_2048_SYNTH_Roughness.png"
    $normal = Join-Path $assetOutDir "$stem`_2048_SYNTH_Normal.png"
    [PopTodayImageOps]::ResizePng($src, $albedo, $TargetSize)
    [PopTodayImageOps]::HeightMap($src, $height, $TargetSize)
    [PopTodayImageOps]::RoughnessMap($src, $rough, $TargetSize)
    [PopTodayImageOps]::NormalFromHeight($src, $normal, $TargetSize, 5.0)
    $outputs = @($albedo, $height, $rough, $normal)
  } elseif ($asset.kind -eq "white_key_decal_candidate") {
    $cutout = Join-Path $assetOutDir "$stem`_2048_SYNTH_ALPHA_CutoutCandidate.png"
    $alpha = Join-Path $assetOutDir "$stem`_2048_SYNTH_AlphaCandidate.png"
    [PopTodayImageOps]::WhiteKeyCutout($src, $cutout, $alpha, $TargetSize)
    $outputs = @($cutout, $alpha)
  } elseif ($asset.kind -eq "vfx_reference") {
    $reference = Join-Path $assetOutDir "$stem`_2048_REFERENCE_NotFlipbook.png"
    $alpha = Join-Path $assetOutDir "$stem`_2048_SYNTH_GlowAlphaCandidate_NotFlipbook.png"
    [PopTodayImageOps]::ResizePng($src, $reference, $TargetSize)
    [PopTodayImageOps]::GlowAlphaCandidate($src, $alpha, $TargetSize)
    $outputs = @($reference, $alpha)
  } else {
    $reference = Join-Path $assetOutDir "$stem`_2048_REFERENCE.png"
    [PopTodayImageOps]::ResizePng($src, $reference, $TargetSize)
    $outputs = @($reference)
  }

  $fileFacts = @($outputs | ForEach-Object {
    $img = [System.Drawing.Image]::FromFile($_)
    try {
      $sampleMinAlpha = 255
      $sampleMaxAlpha = 0
      $stepX = [Math]::Max(1, [Math]::Floor($img.Width / 64))
      $stepY = [Math]::Max(1, [Math]::Floor($img.Height / 64))
      for ($y = 0; $y -lt $img.Height; $y += $stepY) {
        for ($x = 0; $x -lt $img.Width; $x += $stepX) {
          $a = $img.GetPixel($x, $y).A
          if ($a -lt $sampleMinAlpha) { $sampleMinAlpha = $a }
          if ($a -gt $sampleMaxAlpha) { $sampleMaxAlpha = $a }
        }
      }

      [pscustomobject]@{
        path = (Resolve-Path $_).Path.Replace($repoRoot + "\", "").Replace("\", "/")
        bytes = (Get-Item $_).Length
        width = $img.Width
        height = $img.Height
        pixel_format = $img.PixelFormat.ToString()
        alpha_capable_format = [System.Drawing.Image]::IsAlphaPixelFormat($img.PixelFormat)
        sampled_alpha_min = $sampleMinAlpha
        sampled_alpha_max = $sampleMaxAlpha
        sampled_transparency = ($sampleMinAlpha -lt 255)
      }
    } finally {
      $img.Dispose()
    }
  })

  $results += [pscustomobject]@{
    asset_id = $asset.id
    status = "processed"
    readiness = $asset.readiness
    usefulness = $asset.usefulness
    blockers = $asset.blockers
    source = "public/assets/draft/oddly-godly-pop-today/$($asset.source)"
    outputs = $fileFacts
  }
}

$status = [ordered]@{
  status = "PASS_TECHNICAL_PACK_WITH_LIMITATIONS"
  generated_at = (Get-Date).ToUniversalTime().ToString("o")
  source_run_manifest = "foreman/ghost-forge/GHOST_FORGE_POP_TODAY_LIVE_RESULTS_20260629.json"
  source_output_dir = "public/assets/draft/oddly-godly-pop-today"
  technical_output_dir = "public/assets/draft/oddly-godly-pop-today-technical"
  target_size = $TargetSize
  native_generation = $false
  paid_provider_call = $false
  image_generation_call = $false
  results = $results
}

New-Item -ItemType Directory -Force -Path (Split-Path $statusPath -Parent) | Out-Null
$status | ConvertTo-Json -Depth 10 | Set-Content -Path $statusPath -Encoding UTF8
$status | ConvertTo-Json -Depth 10
