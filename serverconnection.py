import mysql.connector

try:
    connection = mysql.connector.connect(
        host="localhost",  # Replace with your database host
        user="root",       # Replace with your database username
        password="",  # Replace with your database password
        database="grocery_store"   # Replace with your database name
    )
    cursor = connection.cursor()
    print("Connection successful")
except mysql.connector.Error as err:
    print(f"Error: {err}")
