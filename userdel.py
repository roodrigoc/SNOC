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