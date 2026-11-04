const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '8b966050a1e124f10fc05a3ecec46adc';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export async function uploadToImgBB(buffer: Buffer, fileName?: string): Promise<string> {
  if (!IMGBB_API_KEY) throw new Error('IMGBB_API_KEY is not configured');

  const base64 = buffer.toString('base64');

  const params = new URLSearchParams();
  params.append('key', IMGBB_API_KEY);
  params.append('image', base64);
  if (fileName) params.append('name', fileName);

  const res = await fetch(IMGBB_UPLOAD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ImgBB upload failed: ${res.status} ${errText}`);
  }
  const data = await res.json();
  if (!data.success) throw new Error('ImgBB upload failed: ' + JSON.stringify(data));
  return data.data.display_url as string;
}
