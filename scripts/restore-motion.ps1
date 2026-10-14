$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$motionPath = Join-Path $projectRoot 'vendor/motion'
if (Test-Path -LiteralPath $motionPath) { throw 'vendor/motion already exists. Preserve the existing checkout; restoration skipped.' }
git clone https://github.com/motiondivision/motion.git $motionPath
if ($LASTEXITCODE -ne 0) { throw 'Clone failed' }
git -C $motionPath checkout 790a654dfef305307c566cf4e94d67a9f7a403c8
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
git -C $motionPath apply (Join-Path $projectRoot 'patches/motion-webview-types.patch')
if ($LASTEXITCODE -ne 0) { throw 'Patch failed' }
