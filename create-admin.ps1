$headers = @{
    'Content-Type' = 'application/json'
}

$body = @{
    firstName = 'Admin'
    lastName = 'User'
    email = 'admin@movies.com'
    password = 'adminpass'
    username = 'admin'
    roles = @('admin', 'user')
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri 'http://localhost:3000/user' -Method Post -Headers $headers -Body $body
$response.Content
