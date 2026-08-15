#!/bin/sh
# filter-branch 的 index-filter：从每个 commit 的索引中移除大文件
git rm -r --cached --ignore-unmatch jdk-21.0.12+8 jdk-21.zip
git rm -r --cached --ignore-unmatch '*.apk' '*.pdf' '*.zip'
git rm -r --cached --ignore-unmatch dist node_modules
true