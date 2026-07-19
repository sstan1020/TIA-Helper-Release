param([string]$Command)
$pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", "tia_helper", [System.IO.Pipes.PipeDirection]::InOut)
$pipe.Connect(10000)
$writer = New-Object System.IO.StreamWriter($pipe)
$writer.AutoFlush = $true
$reader = New-Object System.IO.StreamReader($pipe)
$writer.WriteLine($Command)
Write-Output $reader.ReadLine()
$pipe.Dispose()
