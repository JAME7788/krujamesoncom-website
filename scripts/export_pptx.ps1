param (
    [string]$pptPath,
    [string]$outFolder
)

if (-Not (Test-Path $outFolder)) {
    New-Item -ItemType Directory -Force -Path $outFolder | Out-Null
}

$pptPath = (Resolve-Path $pptPath).Path
$outFolder = (Resolve-Path $outFolder).Path

try {
    $powerpoint = New-Object -ComObject PowerPoint.Application
    # We don't want to show the UI
    # $powerpoint.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue
    
    $presentation = $powerpoint.Presentations.Open($pptPath, $true, $false, $false)
    
    # 17 represents ppSaveAsJPG
    $presentation.SaveAs($outFolder, 17)
    $presentation.Close()
    
    Write-Output "Successfully exported slides to $outFolder"
} catch {
    Write-Error "Failed to export slides: $_"
} finally {
    if ($powerpoint) {
        $powerpoint.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($powerpoint) | Out-Null
    }
}
