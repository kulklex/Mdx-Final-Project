import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Entypo } from '@expo/vector-icons'
import tailwind from 'tailwind-rn'

export default function CameraButton({title, onPress, icon, color}) {
  return (
    <TouchableOpacity style={tailwind('flex-row items-center justify-center h-10')} onPress={onPress}>
        <Entypo name={icon} size={40} color={color ? color : '#f1f1f1'} />
        <Text style={tailwind('font-bold text-xl ml-2 text-gray-400')}>
            {title}
        </Text> 
    </TouchableOpacity>
  )
}