function FilePreview({ selectedFile, filePreview, cancelFile }) {
  if (!selectedFile) return null;

  return (
    <div className="mb-2 flex items-center gap-2 bg-slate-700 py-2 px-3 rounded-lg">
      {filePreview && (
        <img
          src={filePreview}
          alt="preview"
          className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded"
        />
      )}
      <span className="text-xs sm:text-sm text-white truncate">
        {selectedFile.name}
      </span>
      <button
        type="button"
        onClick={cancelFile}
        className="text-red-400 text-xs sm:text-sm ml-auto"
      >
        Удалить
      </button>
    </div>
  );
}

export default FilePreview;