const baseUrl = process.env.NODE_ENV === "production"
? 'https://ceter.com.co'
: 'http://localhost:3000';


export default baseUrl;