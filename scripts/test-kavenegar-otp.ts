#!/usr/bin/env ts-node
import { config } from 'dotenv';
import { SMS_TEMPLATES } from '../src/sms/sms-templates.constants';

config();

const phone = process.argv[2] || '09127840027';
const token = process.argv[3] || String(Math.floor(100000 + Math.random() * 900000));
const apiKey = (process.env.KAVENEGAR_API_KEY || '').trim();

if (!apiKey) {
  console.error('KAVENEGAR_API_KEY is missing');
  process.exit(1);
}

const url = new URL(`https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`);
url.searchParams.set('receptor', phone);
url.searchParams.set('token', token);
url.searchParams.set('template', SMS_TEMPLATES.SIGNUP_VERIFICATION);
url.searchParams.set('type', 'sms');

console.log('Testing Kavenegar verify/lookup');
console.log('Phone:', phone);
console.log('Template:', SMS_TEMPLATES.SIGNUP_VERIFICATION);

fetch(url.toString())
  .then(async (response) => {
    const body = await response.json();
    console.log('HTTP status:', response.status);
    console.log('Response:', JSON.stringify(body, null, 2));
  })
  .catch((error) => {
    console.error('Request failed:', error);
    process.exit(1);
  });
