import base64
import time

def enc_passwd(password):
    encoded_passwd = base64.b64encode(password.encode('utf-8'))
    return encoded_passwd.decode('utf-8')

def addusr(username, password, conf_file):
    encrypted_password = enc_passwd(password)
    with open(conf_file, 'a') as file:
        file.write(f"\n{username}:{encrypted_password}")

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
        print(f"User '{username}' added with password '123456'.")
        
        time.sleep(5)  # Adiciona uma pausa de 5 segundos
        print("\nCreating another user...\n")

if __name__ == "__main__":
    main()