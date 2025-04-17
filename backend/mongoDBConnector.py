
import certifi
ca = certifi.where()

from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from datetime import datetime
from typing import TypedDict
import copy

# MongoDB setup
client = MongoClient("mongodb+srv://Brandon_Tran07:Roblox89@stockpredictor.wjef4.mongodb.net/?retryWrites=true&w=majority&appName=StockPredictor", tlsCAFile=ca)
db = client["MoneyManagement"]
collection = db["Budgets"]

DEFAULT_DATA = {
    "_id": "example@gmail.com",
    # "Name": "",

    "Balance": 0,
    "Income": 0,
    "Expenses": 0,
    "Budgets": [],
    "Transactions": [],

    "StartDate": "",
    "CurrentTransactions": [], # Current period transactions
    "PreviousTransactions": [],
}

# Function to update existing user's data
# update_user_financial_info(
#     email="user@example.com",
#     set_values={"Budget.Work": 1500}  # Only updates the Work value inside Budget, creates Work budget if does not exist
# )
# update_user_financial_info(
#     email="user@example.com",
#     set_values={"Balance": 1500} 
# )
def update_user_financial_info(email, set_values={}, push_values={}):
    result = collection.update_one(
        {"_id": email},
        {"$set": set_values, "$push": push_values}
    )
    if result.matched_count:
        print(f"Updated financial info for {email}")
    else:
        print(f"No record found for {email}")

def add_transaction(email, transaction):
    required_fields = ["type", "category", "amount", "description"]

    # Check for missing fields
    missing_fields = [field for field in required_fields if field not in transaction]
    if missing_fields:
        raise ValueError(f"Missing required transaction fields: {missing_fields}")
    
    # Make sure user exists
    user = get_user_financial_info(email)
    amount = transaction["amount"]

    set_dict = {}
    if transaction["type"].lower() == "income":
        set_dict["Income"] = user["Income"] + amount
        set_dict["Balance"] = user["Balance"] + amount
    else:
        set_dict["Expenses"] = user["Expenses"] + amount
        set_dict["Balance"] = user["Balance"] - amount

    # budgets = user["Budgets"]
    # for current_budget in budgets:
    #     if current_budget["category"] == transaction["category"]:
    #         current_budget["spent"] += transaction["amount"]
    #         set_dict["Budgets"] = budgets
    #         break
    
    # Add transaction
    transaction["date"] = datetime.now().strftime("%Y-%m-%d")
    result = collection.update_one(
        {"_id": email},
        {"$push": {"Transactions": transaction, "CurrentTransactions": transaction}, "$set": set_dict}
    )
    print(f"Transaction added for {email}")

    return result

class UpdateBudget(TypedDict):
    category: str
    limit: float

def update_budget(email: str, budget: UpdateBudget):
    user = get_user_financial_info(email)
    user_budgets = user["Budgets"]

    category_exists = any(current_budget["category"] == budget["category"] for current_budget in user_budgets)
    
    if not category_exists:
        user_budgets.append({
            "category": budget["category"],
            # "spent": 0,
            "limit": budget["limit"]
        })
    else:
        index_of_budget = next((index for index, item in enumerate(user_budgets) if item["category"] == budget["category"]), -1)
        user_budgets[index_of_budget]["limit"] = budget["limit"]
        
    
    update_user_financial_info(email, {"Budgets": user_budgets})

def remove_budget(email: str, budget_name: str):
    user = get_user_financial_info(email)
    user_budgets = user["Budgets"]

    for i in range(len(user_budgets)):
        current_budget = user_budgets[i]
        if current_budget["category"] == budget_name:
            user_budgets.pop(i)
            break
    
    update_user_financial_info(email, {"Budgets": user_budgets})

# Function to get user data
def get_user_financial_info(email):
    user_data = collection.find_one({"_id": email})

    if user_data:
        # Already has data
        print(f"User data found for {email}")

        for key, value in DEFAULT_DATA.items():
            if key not in user_data:
                print(f"{key} did not exist for {email}. Adding it to the user data.")
                user_data[key] = copy.deepcopy(value)
        
        # collection.replace_one(
        #     {"_id": email},
        #     user_data
        # )
    else:
        # Does not have data, create new data
        user_data = copy.deepcopy(DEFAULT_DATA)
        user_data["_id"] = email

        collection.insert_one(user_data)
        print(f"Created new user record for {email}")
    
    if user_data["StartDate"] == "":
        # Set start date
        update_user_financial_info(email, {"StartDate": datetime.now().strftime("%Y-%m-%d")})
    
    return user_data
    

# get_user_financial_info('random_email@outlook.com')
# update_budget("bananna", {"category": "Food", "limit": 2000})
# update_budget("bananna", {"category": "Housing", "limit": 5000})

def reset_month(email):
    user = get_user_financial_info(email)

    if len(user["CurrentTransactions"]) == 0:
        return

    set_dict = {
        "CurrentTransactions": [],
        "StartDate": datetime.now().strftime("%Y-%m-%d"),
        "Expenses": 0,
        "Income": 0
    }

    push_dict = {
        "PreviousTransactions": {
            "StartDate": user["StartDate"],
            "EndDate": datetime.now().strftime("%Y-%m-%d"),
            "Transactions": user["CurrentTransactions"],
            "Budgets": user["Budgets"]
        }
    }

    update_user_financial_info(email, set_dict, push_dict)
