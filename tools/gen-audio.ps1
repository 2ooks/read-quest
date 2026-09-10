# Synthesizes baseline audio for every clip in tools/manifest.json using the
# Windows speech engine (SAPI, Microsoft Zira). Isolated phonemes use SSML
# <phoneme> tags so consonants come out clipped ("t", not "tee" or "tuh").
# Output: raw WAVs in tools/wav/ — post-process with tools/post-audio.py.
param([string]$Voice = 'Microsoft Zira')

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$manifest = Get-Content "$root\tools\manifest.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$out = "$root\tools\wav"
New-Item -ItemType Directory -Force -Path $out | Out-Null

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$names = $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }
$pick = $names | Where-Object { $_ -eq $Voice } | Select-Object -First 1
if (-not $pick) { $pick = $names | Where-Object { $_ -like "*Zira*" } | Select-Object -First 1 }
if (-not $pick) { $pick = $names | Select-Object -First 1 }
Write-Host "voice: $pick"
$synth.SelectVoice($pick)
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)

$i = 0
foreach ($c in $manifest) {
  $path = "$out\$($c.id).wav"
  $i++
  if (Test-Path $path) { continue }
  $synth.SetOutputToWaveFile($path, $fmt)
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>$($c.ssml)</speak>"
  try { $synth.SpeakSsml($ssml) } catch { Write-Warning "failed $($c.id): $_" }
  $synth.SetOutputToNull()
  if ($i % 50 -eq 0) { Write-Host "$i / $($manifest.Count)" }
}
$synth.Dispose()
Write-Host "done: $i clips in $out"
