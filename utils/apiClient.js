const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL;

// Retrieve API key from environment variables
const API_KEY = process.env.API_KEY;

/**
 * Handles API responses, checking for errors and parsing JSON.
 */
async function handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
        const error = new Error(data.error || `API Error: ${response.status} ${response.statusText}`);
        error.status = response.status;
        error.data = data; // Attach full error data if needed
        throw error;
    }
    return data;
}

/**
 * Performs a GET request to the API.
 */
async function get(endpoint, params) {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }
    const response = await fetch(url.toString(), {
        headers: {
            'x-api-key': API_KEY, // Add API key header
        },
    });
    return handleResponse(response);
}

/**
 * Performs a POST request to the API.
 */
async function post(endpoint, body) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY, // Add API key header
        },
        body: JSON.stringify(body),
    });
    return handleResponse(response);
}

/**
 * Performs a PUT request to the API.
 */
async function put(endpoint, body) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY, // Add API key header
        },
        body: JSON.stringify(body),
    });
    return handleResponse(response);
}

/**
 * Performs a DELETE request to the API.
 */
async function del(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
            'x-api-key': API_KEY, // Add API key header
        },
    });
    return handleResponse(response);
}

/**
 * Helper to get student data by user ID.
 */
async function getStudentDataByUserId(userId) {
    const data = await get('/students', { user_id: userId, limit: 1 });
    if (!data.students || data.students.length === 0) {
        const error = new Error('Student not found for user ID');
        error.status = 404;
        throw error;
    }
    return data.students[0];
}

/**
* Helper to get student ID by user ID.
*/
async function getStudentIdByUserId(userId) {
    const studentData = await getStudentDataByUserId(userId);
    return studentData.student_id;
}


module.exports = {
    get,
    post,
    put,
    del,
    getStudentDataByUserId,
    getStudentIdByUserId,
};
