export interface UploadPolicy {
  allowedMimeTypes: readonly string[];
  maximumBytes: number;
  label: string;
}

export async function prepareFileUpload(file: File, policy: UploadPolicy) {
  if (!policy.allowedMimeTypes.includes(file.type)) {
    throw new Error(`${policy.label}: this file type is not supported.`);
  }
  if (!file.size) throw new Error(`${policy.label}: the selected file is empty.`);
  if (file.size > policy.maximumBytes) {
    throw new Error(`${policy.label}: the file exceeds the ${Math.round(policy.maximumBytes / 1024 / 1024)} MB limit.`);
  }
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error(`${policy.label}: unable to read the selected file.`));
    reader.onload = () => {
      const value = String(reader.result || '');
      const marker = ';base64,';
      const index = value.indexOf(marker);
      if (index < 0) reject(new Error(`${policy.label}: the selected file could not be encoded.`));
      else resolve(value.slice(index + marker.length));
    };
    reader.readAsDataURL(file);
  });
  return { name: file.name, mimeType: file.type, base64, size: file.size };
}
