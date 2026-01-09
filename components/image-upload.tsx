'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, onRemove, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    
    if (!file) return

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload fehlgeschlagen')
      }

      const data = await response.json()
      onChange(data.imageUrl)
      
      toast({
        title: 'Erfolgreich hochgeladen',
        description: 'Das Bild wurde erfolgreich hochgeladen'
      })
    } catch (error) {
      toast({
        title: 'Fehler beim Upload',
        description: error instanceof Error ? error.message : 'Bitte versuchen Sie es erneut',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }, [onChange, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    disabled: disabled || isUploading
  })

  if (value) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
        <Image
          src={value}
          alt="Uploaded"
          fill
          className="object-cover"
        />
        {!disabled && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`
        relative w-full aspect-video rounded-lg border-2 border-dashed 
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'}
        ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}
        transition-colors
      `}
    >
      <input {...getInputProps()} />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Wird hochgeladen...</p>
          </>
        ) : isDragActive ? (
          <>
            <Upload className="h-8 w-8 text-primary" />
            <p className="text-sm text-primary">Datei hier ablegen</p>
          </>
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600 font-medium">
              Klicken oder Bild hierher ziehen
            </p>
            <p className="text-xs text-gray-500">
              JPEG, PNG, WebP • Max. 5MB
            </p>
          </>
        )}
      </div>
    </div>
  )
}