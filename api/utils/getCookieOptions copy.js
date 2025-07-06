const isDev = process.env.NODE_ENV === 'development';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: !isDev, 
  sameSite: isDev ? 'Lax' : 'None',
});



export default getCookieOptions