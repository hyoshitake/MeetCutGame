#!/usr/bin/env pwsh
<#
.SYNOPSIS
    プロンプトファイルを作成するスクリプト
.DESCRIPTION
    指定された引数をスネークケースに変換し、日時情報と組み合わせてプロンプトファイルを作成します。
.PARAMETER InputString
    プロンプトファイル名のベースとなる文字列
.EXAMPLE
    makep "Hello World" -> 202504231530_hello_world.txt
#>

param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$InputString
)

# 引数がない場合はエラーメッセージを表示して終了
if ([string]::IsNullOrEmpty($InputString)) {
  Write-Host "エラー: 引数を指定してください。" -ForegroundColor Red
  Write-Host "使用方法: makep 'ファイル名のベース'" -ForegroundColor Yellow
  exit 1
}

# 現在の日時を取得してフォーマット (yyyymmddhhss)
$timestamp = Get-Date -Format "yyyyMMddHHmm"

# 文字列をスネークケースに変換
function ConvertTo-SnakeCase {
  param([string]$str)

  # すでにスネークケースの場合は処理を簡略化
  if ($str -match "^[a-z0-9_]+$") {
    return $str
  }

  # スペースをアンダースコアに置換
  $snakeCase = $str -replace '\s+', '_'

  # キャメルケースやパスカルケースを処理 (大文字の前にアンダースコアを挿入)
  $snakeCase = $snakeCase -replace '(?<=[a-z0-9])(?=[A-Z])', '_'

  # すべて小文字に変換
  $snakeCase = $snakeCase.ToLower()

  # 連続するアンダースコアを1つに置換
  $snakeCase = $snakeCase -replace '_+', '_'

  # 先頭と末尾のアンダースコアを削除
  $snakeCase = $snakeCase.Trim('_')

  return $snakeCase
}

# 入力文字列をスネークケースに変換
$snakeCaseString = ConvertTo-SnakeCase -str $InputString

# ファイル名を作成
$fileName = "${timestamp}_${snakeCaseString}.txt"

# promptディレクトリのパスを作成
$promptDir = Join-Path -Path $PSScriptRoot -ChildPath "prompt"

# promptディレクトリが存在しない場合は作成
if (-not (Test-Path -Path $promptDir)) {
  New-Item -Path $promptDir -ItemType Directory | Out-Null
  Write-Host "promptディレクトリを作成しました。" -ForegroundColor Green
}

# ファイルのフルパスを作成
$filePath = Join-Path -Path $promptDir -ChildPath $fileName

# 空のファイルを作成
New-Item -Path $filePath -ItemType File | Out-Null

# 結果を出力
Write-Host "プロンプトファイルを作成しました: $fileName" -ForegroundColor Green
Write-Host "git commit -m ""$fileName"" を実行" -ForegroundColor Cyan

# ファイルパスを返す (エディタで開くなどの操作に使用可能)
return $filePath
