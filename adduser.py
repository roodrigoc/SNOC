"""
Copyright (C) 2024 Rodrigo Costa (roodrigoc@hotmail.com)

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; either version 3, or (at your option) any
later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; see the file COPYING. If not, see
<http://www.gnu.org/licenses/>.
"""
import base64
import time

def enc_passwd(password):
    encoded_passwd = base64.b64encode(password.encode('utf-8'))
    return encoded_passwd.decode('utf-8')

def addusr(username, password, conf_file):
    encrypted_password = enc_passwd(password)
    with open(conf_file, 'r') as file:
        lines = file.readlines()
        for line in lines:
            if line.startswith(username + ':'):
                print(f"Username '{username}' already exists. Please choose another username.")
                return

    with open(conf_file, 'a') as file:
        file.write(f"\n{username}:{encrypted_password}")

    with open(conf_file, 'r') as file:
        lines = file.readlines()
    with open(conf_file, 'w') as file:
        for line in lines:
            if line.strip():
                file.write(line)

    print(f"User '{username}' added with password '{password}'.")

def main():
    while True:
        username = input("Enter the username for the new user: ").strip()
        if not username:
            print("Username cannot be empty. Please enter a valid username.")
            continue
        if ' ' in username:
            print("Username cannot contain spaces. Please enter a valid username.")
            continue
        
        addusr(username, "123456", "users.conf")
        
        time.sleep(1)
        print("\nCreating another user...\n")

if __name__ == "__main__":
    main()
