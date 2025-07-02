'use server'
import { createClient } from '@/util/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';


export async function login(formData: FormData) {
    const supabase = await createClient()
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      redirect('/error')
    }
    revalidatePath('/', 'layout')
    redirect('/')
  }


export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  if (!isEmail(email) ) {
    redirect('/error')
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect('/error')
  }

  const user = data.user
  if (!user) {
    redirect('/error')
  }
  //profile
  const { error: profileError } = await supabase.from('profile').insert({
    id: user.id, 
    username,
  })

  if (profileError) {
    console.error('Profile creation failed:', profileError.message)
    redirect('/error') 
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getUsername(userId: string): Promise<string | null> {
    const supabase = await createClient()
  
    const { data, error } = await supabase
      .from('profile')
      .select('username')
      .eq('id', userId)
      .single()
  
    if (error) {
      console.error('Failed to fetch username:', error.message)
      return null
    }
  
    return data?.username ?? null
  }
  
function isEmail(input: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  }