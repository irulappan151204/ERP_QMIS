import re

with open('src/Pages/Librarian/LibraryManagementWorkspace.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

print("Tabs in LibraryManagementWorkspace:")
for m in re.findall(r"activeTab\s*===?\s*'([^']+)'", text):
    print(" ", m)

with open('src/Pages/Librarian/BookManagement/BookList/BookList.jsx', 'r', encoding='utf-8') as f:
    text2 = f.read()
print("BookList.jsx line count:", len(text2.splitlines()))

with open('src/Routes/LibrarianRoutes.jsx', 'r', encoding='utf-8') as f:
    text3 = f.read()
print("LibrarianRoutes.jsx:")
for line in text3.splitlines():
    if 'Route' in line or 'path' in line:
        print(" ", line.strip())
