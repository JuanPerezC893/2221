const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFile = async (fileContent, mimetype) => {
  try {
    // Convertir el buffer a una Data URI
    const dataUri = `data:${mimetype};base64,${fileContent.toString('base64')}`;

    const uploadOptions = {
      folder: 'residuos-certificados',
      resource_type: 'auto' // Volver a auto
    };

    // Si es un PDF, dar una pista explícita a Cloudinary
    if (mimetype === 'application/pdf') {
      uploadOptions.format = 'pdf';
    }

    const result = await cloudinary.uploader.upload(dataUri, uploadOptions);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

module.exports = { uploadFile };
