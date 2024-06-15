import string
import os

def decrement_hex_string(hex_str):
    hex_digits = string.digits + 'abcdef'
    max_len = len(hex_str)
    
    # Convert the hex string to a list of integers representing their positions in `hex_digits`
    indices = [hex_digits.index(c) for c in hex_str]
    
    # Perform the decrement
    i = max_len - 1
    while i >= 0:
        indices[i] -= 1
        if indices[i] == -1:  # rollover
            indices[i] = 15
            i -= 1
        else:
            break
    
    # Convert indices back to the hex string
    new_hex_str = ''.join(hex_digits[idx] for idx in indices)
    return new_hex_str

def read_last_line(file_path):
    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
        return 'f' * 64  # Starting point as all 'f's
    with open(file_path, 'rb') as file:
        file.seek(-2, os.SEEK_END)
        while file.read(1) != b'\n':
            if file.tell() <= 1:
                file.seek(0)
                break
            file.seek(-2, os.SEEK_CUR)
        last_line = file.readline().decode()
    return last_line.strip()

# Path to the file
file_path = 'privateethkey.txt'

# Read the last key from the file
last_key = read_last_line(file_path)

# Open the file in append mode
with open(file_path, 'a') as file:
    # Decrement the string and write results to the file indefinitely
    hex_str = last_key
    while True:
        hex_str = decrement_hex_string(hex_str)
        file.write(hex_str + '\n')
        file.flush()  # Ensure data is written to the file immediately
