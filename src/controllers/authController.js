const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate the input
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        if (
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Email and password must be strings"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (
            normalizedEmail.length === 0 ||
            normalizedEmail.length > 255 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            });
        }

        if (
            password.length < 8 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and at most 72 bytes"
            });
        }

        // 2. Hash the password
        const passwordHash = await bcrypt.hash(password, 12);

        // 3. Store the new user in PostgreSQL
        const result = await pool.query(
            `INSERT INTO users (email, password_hash)
             VALUES ($1, $2)
             RETURNING id, email, created_at`,
            [normalizedEmail, passwordHash]
        );

        // 4. Send a safe response
        return res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });

    } catch (error) {
        // 5. Handle duplicate emails
        if (error.code === "23505") {
            return res.status(409).json({
                message: "An account with this email already exists"
            });
        }

        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Something went wrong during registration"
        });
    }
};

module.exports = { register };