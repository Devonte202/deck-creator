import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Oauth2Client from "@/app/utils/google-auth";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  
  if (error) {
    return NextResponse.json({error: 'Google OAuth Error: ' + error});
  }

  if(!code) {
    return NextResponse.json({error: 'Authorization code not found'});
  }

  try {
    const { tokens } = await Oauth2Client.getToken(code);
    console.log(tokens)

    const cookieStore = await cookies();
    cookieStore.set('google_access_token', tokens.access_token);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    return NextResponse.json({error: 'Google OAuth Error failed to exchange code: ' + error.message});
  }
}
