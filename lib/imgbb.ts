const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export async function uploadToImgBB(buffer: Buffer, fileName?: string): Promise<string> {
  if (!IMGBB_API_KEY) throw new Error('IMGBB_API_KEY is not configured');

  const base64 = buffer.toString('base64');
  const formData = new FormData();
  formData.append('image', base64);
  if (fileName) formData.append('name', fileName);

  const res = await fetch(`${IMGBB_UPLOAD_URL}?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error(`ImgBB upload failed: ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error('ImgBB upload failed');
  return data.data.display_url as string;
}
