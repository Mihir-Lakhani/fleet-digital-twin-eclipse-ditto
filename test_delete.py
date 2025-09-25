import requests
import json

def test_delete_thing():
    # First, get the current things
    print("=== Testing DELETE Thing Functionality ===")
    print("\n1. Getting current things...")
    response = requests.get('http://localhost:5000/mongodb/things')
    if response.status_code == 200:
        data = response.json()
        things = data.get('things', [])
        print(f"Current things: {len(things)}")
        for thing in things:
            print(f"  - {thing.get('thingId', 'Unknown')}")
        
        if things:
            # Test deleting the first thing
            thing_to_delete = things[0]['thingId']
            print(f"\n2. Testing DELETE for thing: {thing_to_delete}")
            
            delete_response = requests.delete(f'http://localhost:5000/mongodb/things/{thing_to_delete}')
            print(f"DELETE Status: {delete_response.status_code}")
            
            if delete_response.status_code == 204:
                print("✅ DELETE successful!")
                
                # Verify deletion by getting things again
                print("\n3. Verifying deletion...")
                verify_response = requests.get('http://localhost:5000/mongodb/things')
                if verify_response.status_code == 200:
                    new_data = verify_response.json()
                    new_things = new_data.get('things', [])
                    print(f"Things after deletion: {len(new_things)}")
                    
                    if len(new_things) == len(things) - 1:
                        print("✅ Thing successfully deleted from database!")
                        remaining_ids = [t.get('thingId') for t in new_things]
                        print(f"Remaining things: {remaining_ids}")
                    else:
                        print("❌ Thing count didn't decrease as expected")
                else:
                    print(f"❌ Failed to verify deletion: {verify_response.status_code}")
            else:
                print(f"❌ DELETE failed: {delete_response.status_code}")
                try:
                    error_data = delete_response.json()
                    print(f"Error: {error_data}")
                except:
                    print(f"Error text: {delete_response.text}")
        else:
            print("No things to delete")
    else:
        print(f"Failed to get things: {response.status_code}")

if __name__ == "__main__":
    test_delete_thing()