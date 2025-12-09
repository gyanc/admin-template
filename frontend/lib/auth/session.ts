import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE } from "../api-client";
import { AuthResponse, User, Staff } from "../types";

type SessionUser = User | Staff;

interface SessionResult {
  user: SessionUser;
}

const ACCESS_COOKIE = "access_token";

export async function getSession(): Promise<SessionResult | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as AuthResponse | { user: SessionUser | any };
    
    // Extract user from response
    let user: SessionUser | null = null;
    if (data && typeof data === 'object') {
      if ('user' in data) {
        user = data.user as SessionUser;
      } else {
        // Response might be the user object directly
        user = data as unknown as SessionUser;
      }
    }
    
    if (!user) return null;
    
    // Normalize user data - ensure it has the expected structure
    // Backend might return roles as array of strings or objects
    if (user && !user.roles) {
      user.roles = [];
    }
    
    // If roles are strings, convert to Role objects
    if (user.roles && user.roles.length > 0 && typeof user.roles[0] === 'string') {
      user.roles = user.roles.map((roleName: string) => ({
        id: '',
        name: roleName,
        isActive: true,
        createdAt: '',
        updatedAt: '',
        permissions: [],
      }));
    }
    
    // Ensure firstName/lastName exist (backend might return 'name')
    if (user && 'name' in user && !('firstName' in user)) {
      const nameParts = (user.name as string || '').split(' ');
      (user as any).firstName = nameParts[0] || '';
      (user as any).lastName = nameParts.slice(1).join(' ') || '';
    }

    return { user };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionResult> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
