
with open('src/components/ai/AIAssistantChat.tsx', 'rb') as f:
    f.seek(-20, 2)
    bytes_data = f.read()
    print("Bytes:", [b for b in bytes_data])
    print("Has closing brace (125):", 125 in bytes_data)
