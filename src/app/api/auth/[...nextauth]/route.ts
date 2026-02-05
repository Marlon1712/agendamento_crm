
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

// Helper to refresh the token
async function refreshAccessToken(token: any) {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fallback to old refresh token
    };
  } catch (error) {
    console.log("RefreshAccessTokenError", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "https://www.googleapis.com/auth/calendar email profile openid", 
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null;
          
          try {
              console.log("Login attempt for:", credentials.email);
              const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [credentials.email]);
              console.log("DB User found:", rows.length > 0 ? "YES" : "NO");
              
              if (rows.length === 0) {
                  console.log("User not found in DB");
                  return null;
              }
              
              const user = rows[0];
              if (!user.password) {
                  console.log("User has no password set (Google User)");
                  return null; 
              }
              
              const isValid = await bcrypt.compare(credentials.password, user.password);
              console.log("Password valid:", isValid ? "YES" : "NO");
              
              if (!isValid) return null;
              
              return {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  phone: user.phone
              };
          } catch (error) {
              console.error("Login Error:", error);
              return null;
          }
        }
    })
  ],
  callbacks: {
    async signIn({ user, account }: any) {
       // Google Logic: Check if user exists, if not create. Update tokens if needed?
       // Actually, we usually rely on DB user.
       if (account.provider === 'google') {
           try {
               const adminEmail = process.env.ADMIN_EMAIL;
               const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [user.email]);
               
               let dbUser = rows[0];
               
               if (!dbUser) {
                   // Create new user
                   const role = user.email === adminEmail ? 'admin' : 'client';
                   const [result]: any = await pool.query(
                       'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
                       [user.name, user.email, role]
                   );
                   user.id = result.insertId;
                   user.role = role;
               } else {
                   // Ensure Admin Role if matches ENV
                   if (user.email === adminEmail && dbUser.role !== 'admin') {
                       await pool.query('UPDATE users SET role = "admin" WHERE id = ?', [dbUser.id]);
                       dbUser.role = 'admin';
                   }
                   user.id = dbUser.id;
                   user.role = dbUser.role;
                   user.phone = dbUser.phone;
               }
               return true;
           } catch (e) {
               console.error("Google Signin Error", e);
               return false;
           }
       }
       return true;
    },
    async jwt({ token, user, account }: any) {
      // Initial sign in
      if (account && user) {
        // Persist User Info (Role, ID) in Token
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;

        if (account.provider === 'google') {
            return {
            ...token,
            accessToken: account.access_token,
            accessTokenExpires: Date.now() + (account.expires_in as number) * 1000,
            refreshToken: account.refresh_token,
            };
        }
      }

      // Check access token validity for Google
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }
      
      // If we have a refresh token (Google), try to refresh
      if (token.refreshToken) {
         return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }: any) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.phone = token.phone;
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
      signIn: '/login',
      error: '/login'
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
