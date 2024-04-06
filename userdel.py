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
import time

def delete_user(username):
    with open('users.conf', 'r') as file:
        lines = file.readlines()

    user_deleted = False
    with open('users.conf', 'w') as file:
        for line in lines:
            if line.strip() != '' and not line.startswith(username + ':'):
                file.write(line)
            else:
                user_deleted = True

    return user_deleted

def main():
    while True:
        user_to_delete = input("Enter the username to be deleted: ")

        if delete_user(user_to_delete):
            print(f"User '{user_to_delete}' successfully deleted.")
        else:
            print(f"User '{user_to_delete}' not found. Please try again.")
            continue

        time.sleep(1)
        continue

if __name__ == "__main__":
    main()
