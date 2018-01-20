const streamToPromise = async (strm) =>{
  await new Promise((resolve, reject) => {
    strm.on('error', reject);
    strm.resume();
    strm.on('end', resolve);
  });
};

module.exports = streamToPromise;