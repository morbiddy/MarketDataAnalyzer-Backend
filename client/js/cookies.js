"use strict";

function expires() {
    var date = new Date();
    date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
    return "; expires=" + date.toUTCString();
}

/**
 * Save selected value as json cookie 
 * 
 * @param {String} name 
 * @param {String} value
 */
export function saveCookie(name, value) {    
    const serializedValue = JSON.stringify({value: value});
    console.log(`Set cookie name=${name} value=${value}`);
    document.cookie = name + "=" + (encodeURIComponent(serializedValue) || "") + expires() + "; SameSite=Lax; path=/";
}

/**
 * Return cookie as JSON object or null if not found
 * 
 * @param {String} name
 * @returns json cookie or null
 */
export function getCookie(name) {
    // Encode the cookie name to handle special characters
    var encodedName = encodeURIComponent(name) + "=";
    // Get all cookies from the document and split them into an array
    var cookieArray = document.cookie.split(';');
    // Iterate through each cookie
    for (var i = 0; i < cookieArray.length; i++) {
        var cookie = cookieArray[i].trim();
        // Check if the current cookie string begins with the encoded name
        if (cookie.indexOf(encodedName) == 0) {
            // Decode the cookie value
            var cookieValue = decodeURIComponent(cookie.substring(encodedName.length, cookie.length));
            try {
                // Attempt to parse the cookie value as JSON
                return JSON.parse(cookieValue);
            } catch (e) {
                // Return the raw cookie value if parsing fails
                console.log('Parse json failed: %s',e);
                return null;
            }
        }
    }
    // Return null if the cookie with the specified name is not found
    return null;
}

export function deleteCookie(name) {

}